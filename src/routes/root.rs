use std::sync::Arc;

use anyhow::Context;
use axum::{Extension, Json, http::StatusCode};
use docbox_core::{aws::aws_config, secrets::AppSecretManager};
use docbox_database::{
    DbPool, ROOT_DATABASE_NAME,
    create::{create_database, create_restricted_role, create_tenants_table},
    migrations::apply_tenant_migrations,
    models::tenant::Tenant,
};
use serde_json::json;

use crate::{config::Config, connect_db, error::DynHttpError, models::root::MigrateRequest};

/// GET /root/initialized
///
/// Check if the server has been initialized
pub async fn is_initialized(
    Extension(config): Extension<Arc<Config>>,
) -> Result<StatusCode, DynHttpError> {
    // Try connect to the docbox database
    if let Err(err) = connect_db(
        &config.database.host,
        config.database.port,
        &config.database.setup_user.username,
        &config.database.setup_user.password,
        ROOT_DATABASE_NAME,
    )
    .await
    {
        if !err.as_database_error().is_some_and(|err| {
            err.code()
                .is_some_and(|code| code.to_string().eq("42P01" /* Database does not exist */))
        }) {
            return Err(anyhow::Error::new(err).into());
        }
    }

    Ok(StatusCode::OK)
}

/// POST /root/initialize
///
/// Initialize the root database
pub async fn initialize(
    Extension(config): Extension<Arc<Config>>,
) -> Result<StatusCode, DynHttpError> {
    // Load AWS configuration
    let aws_config = aws_config().await;
    let secrets = AppSecretManager::from_config(&aws_config, config.secrets.clone());

    // Connect to the root postgres database
    let db_root = connect_db(
        &config.database.host,
        config.database.port,
        &config.database.setup_user.username,
        &config.database.setup_user.password,
        "postgres",
    )
    .await
    .context("failed to connect to postgres database")?;

    // Create the tenant database
    if let Err(err) = create_database(&db_root, ROOT_DATABASE_NAME).await {
        if !err
            .as_database_error()
            .is_some_and(|err| err.code().is_some_and(|code| code.to_string().eq("42P04")))
        {
            return Err(anyhow::Error::new(err).into());
        }
    }

    // Connect to the docbox database
    let db_docbox = connect_db(
        &config.database.host,
        config.database.port,
        &config.database.setup_user.username,
        &config.database.setup_user.password,
        ROOT_DATABASE_NAME,
    )
    .await
    .context("failed to connect to docbox database")?;

    // Setup the restricted root db role
    create_restricted_role(
        &db_docbox,
        ROOT_DATABASE_NAME,
        &config.database.root_role_name,
        &config.database.root_secret_password,
    )
    .await
    .context("failed to setup root user")?;
    tracing::info!("created root user");

    let secret_value = serde_json::to_string(&json!({
        "username": config.database.root_role_name,
        "password": config.database.root_secret_password
    }))
    .context("failed to encode secret")?;

    secrets
        .create_secret(&config.database.root_secret_name, &secret_value)
        .await?;

    tracing::info!("created database secret");

    // Initialize the docbox database
    create_tenants_table(&db_docbox)
        .await
        .context("failed to setup tenants table")?;

    Ok(StatusCode::CREATED)
}

pub async fn migrate(
    Extension(config): Extension<Arc<Config>>,
    Json(migrate): Json<MigrateRequest>,
) -> Result<StatusCode, DynHttpError> {
    // Connect to the root database
    let root_db = connect_db(
        &config.database.host,
        config.database.port,
        &config.database.setup_user.username,
        &config.database.setup_user.password,
        ROOT_DATABASE_NAME,
    )
    .await
    .context("failed to connect to root database")?;

    // Load tenants from the database
    let tenants = Tenant::all(&root_db)
        .await
        .context("failed to get tenants")?;

    // Filter to our desired tenants
    let tenants: Vec<Tenant> = tenants
        .into_iter()
        .filter(|tenant| {
            if tenant.env != migrate.env {
                return false;
            }

            if migrate
                .tenant_id
                .as_ref()
                .is_some_and(|schema| tenant.id.ne(schema))
            {
                return false;
            }

            true
        })
        .collect();

    let mut applied_tenants = Vec::new();

    for tenant in tenants {
        let result = migrate_tenant(&config, &root_db, &tenant).await;
        match result {
            Ok(_) => {
                applied_tenants.push((tenant.env, tenant.id));
            }
            Err(error) => {
                tracing::error!(?error, "failed to connect to tenant database");
                if !migrate.skip_failed {
                    tracing::debug!(?applied_tenants, "completed migrations");
                    break;
                }
            }
        }
    }

    tracing::debug!(?applied_tenants, "completed migrations");

    Ok(StatusCode::OK)
}

pub async fn migrate_tenant(
    config: &Config,
    root_db: &DbPool,
    tenant: &Tenant,
) -> anyhow::Result<()> {
    tracing::debug!(
        tenant_id = ?tenant.id,
        tenant_env = ?tenant.env,
        "applying migration against",
    );

    // Connect to the tenant database
    let tenant_db = connect_db(
        &config.database.host,
        config.database.port,
        &config.database.setup_user.username,
        &config.database.setup_user.password,
        &tenant.db_name,
    )
    .await
    .context("failed to connect to tenant database")?;

    let mut root_t = root_db.begin().await?;
    let mut t = tenant_db.begin().await?;
    apply_tenant_migrations(&mut root_t, &mut t, tenant, None).await?;
    t.commit().await?;
    root_t.commit().await?;

    tracing::info!(
        tenant_id = ?tenant.id,
        tenant_env = ?tenant.env,
        "applied migrations against",
    );

    Ok(())
}
