use std::sync::Arc;

use anyhow::Context;
use axum::{Extension, Json, extract::Path, http::StatusCode};
use docbox_core::{aws::aws_config, secrets::AppSecretManager, storage::StorageLayerFactory};
use docbox_database::{
    ROOT_DATABASE_NAME,
    create::{create_database, create_restricted_role},
    models::tenant::Tenant,
    sqlx::types::Uuid,
};
use docbox_search::SearchIndexFactory;
use serde_json::json;

use crate::{config::Config, connect_db, error::DynHttpError, models::tenant::CreateTenant};

pub async fn create(
    Extension(config): Extension<Arc<Config>>,
    Json(tenant_config): Json<CreateTenant>,
) -> Result<StatusCode, DynHttpError> {
    tracing::debug!(?tenant_config, "creating tenant");

    // Load AWS configuration
    let aws_config = aws_config().await;

    // Connect to the "postgres" database to use while creating the tenant database
    let db_postgres = connect_db(
        &config.database.host,
        config.database.port,
        &config.database.setup_user.username,
        &config.database.setup_user.password,
        "postgres",
    )
    .await
    .context("failed to connect to docbox database")?;

    // Create the tenant database
    if let Err(err) = create_database(&db_postgres, &tenant_config.db_name).await {
        if !err
            .as_database_error()
            .is_some_and(|err| err.code().is_some_and(|code| code.to_string().eq("42P04")))
        {
            return Err(anyhow::Error::new(err).into());
        }
    }

    drop(db_postgres);
    tracing::info!("created tenant database");

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

    // Connect to the tenant database
    let tenant_db = connect_db(
        &config.database.host,
        config.database.port,
        &config.database.setup_user.username,
        &config.database.setup_user.password,
        &tenant_config.db_name,
    )
    .await
    .context("failed to connect to tenant database")?;

    // Setup the tenant user
    create_restricted_role(
        &tenant_db,
        &tenant_config.db_name,
        &tenant_config.db_role_name,
        &tenant_config.db_role_password,
    )
    .await
    .context("failed to setup tenant user")?;
    tracing::info!("created tenant user");

    // Create and store the new database secret
    let secret_value = serde_json::to_string(&json!({
        "username": tenant_config.db_role_name,
        "password": tenant_config.db_role_password
    }))
    .context("failed to encode secret")?;

    let secrets = AppSecretManager::from_config(&aws_config, config.secrets.clone());
    secrets
        .create_secret(&tenant_config.db_secret_name, &secret_value)
        .await?;

    tracing::info!("created database secret");

    let search_factory = SearchIndexFactory::from_config(&aws_config, config.search.clone())?;
    let storage_factory = StorageLayerFactory::from_config(&aws_config, config.storage.clone());

    // Attempt to initialize the tenant
    let tenant = docbox_core::tenant::create_tenant::create_tenant(
        &root_db,
        &tenant_db,
        &search_factory,
        &storage_factory,
        docbox_core::tenant::create_tenant::CreateTenant {
            id: tenant_config.id,
            db_name: tenant_config.db_name,
            db_secret_name: tenant_config.db_secret_name,
            s3_name: tenant_config.s3_name,
            os_index_name: tenant_config.os_index_name,
            event_queue_url: tenant_config.event_queue_url,
            origins: tenant_config.origins,
            s3_queue_arn: tenant_config.s3_queue_arn,
            env: tenant_config.env,
        },
    )
    .await
    .context("failed to create tenant")?;

    tracing::info!(?tenant, "tenant created successfully");

    Ok(StatusCode::CREATED)
}

pub async fn get_all(
    Extension(config): Extension<Arc<Config>>,
    Path(env): Path<String>,
) -> Result<Json<Vec<Tenant>>, DynHttpError> {
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

    // Get the tenant details
    let tenant = Tenant::find_by_env(&db_docbox, &env)
        .await
        .context("failed to request tenant")?;
    tracing::debug!(?tenant, "found tenant");

    Ok(Json(tenant))
}

pub async fn get(
    Extension(config): Extension<Arc<Config>>,
    Path((env, tenant_id)): Path<(String, Uuid)>,
) -> Result<Json<Tenant>, DynHttpError> {
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

    // Get the tenant details
    let tenant = Tenant::find_by_id(&db_docbox, tenant_id, &env)
        .await
        .context("failed to request tenant")?
        .context("tenant not found")?;
    tracing::debug!(?tenant, "found tenant");

    Ok(Json(tenant))
}

pub async fn delete(
    Extension(config): Extension<Arc<Config>>,
    Path((env, tenant_id)): Path<(String, Uuid)>,
) -> Result<StatusCode, DynHttpError> {
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

    // Get the tenant details
    let tenant = Tenant::find_by_id(&db_docbox, tenant_id, &env)
        .await
        .context("failed to request tenant")?
        .context("tenant not found")?;
    tracing::debug!(?tenant, "found tenant");

    // ..TODO: Optionally delete S3 bucket, opensearch index, database

    tenant
        .delete(&db_docbox)
        .await
        .context("failed to delete tenant")?;

    tracing::info!("tenant created successfully");

    Ok(StatusCode::OK)
}
