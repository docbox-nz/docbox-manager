use std::sync::Arc;

use crate::{
    DatabaseProvider,
    config::DatabaseConfig,
    error::{DynHttpError, HttpResult},
    models::root::{IsInitializedResponse, MigrateRequest},
};
use anyhow::Context;
use axum::{Extension, Json, http::StatusCode};
use docbox_core::secrets::AppSecretManager;
use docbox_database::{
    DbPool, ROOT_DATABASE_NAME,
    create::{create_database, create_restricted_role, create_tenants_table},
    migrations::apply_tenant_migrations,
    models::tenant::Tenant,
    sqlx::types::Uuid,
};

use rand::{Rng, distributions::Alphanumeric, rngs::OsRng};
use serde_json::json;

/// GET /root/initialized
///
/// Check if the server has been initialized
pub async fn is_initialized(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
) -> HttpResult<IsInitializedResponse> {
    let db = match db_provider.connect(ROOT_DATABASE_NAME).await {
        Ok(value) => value,
        Err(error) => {
            if !error.as_database_error().is_some_and(|error| {
                error.code().is_some_and(|code| {
                    code.to_string().eq("3D000" /* Database does not exist */)
                })
            }) {
                return Err(anyhow::Error::new(error).into());
            }

            // Database is not setup, server is not initialized
            return Ok(Json(IsInitializedResponse { initialized: false }));
        }
    };

    if let Err(error) = Tenant::find_by_id(&db, Uuid::nil(), "__DO_NOT_USE").await {
        if !error.as_database_error().is_some_and(|error| {
            error.code().is_some_and(|code| {
                code.to_string().eq("42P01" /* Table does not exist */)
            })
        }) {
            return Err(anyhow::Error::new(error).into());
        }

        // Database is not setup, server is not initialized
        return Ok(Json(IsInitializedResponse { initialized: false }));
    }

    Ok(Json(IsInitializedResponse { initialized: true }))
}

/// Generates a random password
fn random_password(length: usize) -> anyhow::Result<String> {
    let mut rng = OsRng;
    let mut password: Vec<u8> = Vec::with_capacity(length);

    for _ in 0..length {
        password.push(rng.sample(Alphanumeric));
    }

    Ok(String::from_utf8(password)?)
}

/// POST /root/initialize
///
/// - Create the root database
/// - Setup the root database role
/// - Store the root database credentials
/// - Setup the root database
pub async fn initialize(
    Extension(database_config): Extension<Arc<DatabaseConfig>>,
    Extension(secrets): Extension<Arc<AppSecretManager>>,
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
) -> Result<StatusCode, DynHttpError> {
    // Connect to the root postgres database
    let db_root = db_provider
        .connect("postgres")
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
    let db_docbox = db_provider
        .connect(ROOT_DATABASE_NAME)
        .await
        .context("failed to connect to docbox database")?;

    let root_role_name = "docbox_config_api";
    let root_password = random_password(30).context("failed to generate password")?;

    // Setup the restricted root db role
    create_restricted_role(
        &db_docbox,
        ROOT_DATABASE_NAME,
        root_role_name,
        &root_password,
    )
    .await
    .context("failed to setup root user")?;
    tracing::info!("created root user");

    let secret_value = serde_json::to_string(&json!({
        "username": root_role_name,
        "password": root_password
    }))
    .context("failed to encode secret")?;

    secrets
        .create_secret(&database_config.root_secret_name, &secret_value)
        .await?;

    tracing::info!("created database secret");

    // Initialize the docbox database
    create_tenants_table(&db_docbox)
        .await
        .context("failed to setup tenants table")?;

    Ok(StatusCode::CREATED)
}

/// POST /root/migrate
///
/// Applies migrations against all tenants
pub async fn migrate(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Json(migrate): Json<MigrateRequest>,
) -> Result<StatusCode, DynHttpError> {
    // Connect to the root database
    let root_db = db_provider
        .connect(ROOT_DATABASE_NAME)
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
        let result = migrate_tenant(&db_provider, &root_db, &tenant).await;
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
    db_provider: &DatabaseProvider,
    root_db: &DbPool,
    tenant: &Tenant,
) -> anyhow::Result<()> {
    tracing::debug!(
        tenant_id = ?tenant.id,
        tenant_env = ?tenant.env,
        "applying migration against",
    );

    // Connect to the tenant database
    let tenant_db = db_provider
        .connect(&tenant.db_name)
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
