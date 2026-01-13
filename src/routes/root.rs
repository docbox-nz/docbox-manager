use crate::{
    config::DatabaseConfig,
    database::DatabaseProvider,
    error::{DynHttpError, HttpResult},
    models::root::{IsInitializedResponse, TenantWithMigrations},
};
use axum::{Extension, Json, http::StatusCode};
use docbox_management::tenant::migrate_tenants::MigrateTenantsConfig;
use docbox_secrets::SecretManager;
use futures::{TryStreamExt, stream::FuturesOrdered};
use std::sync::Arc;

/// GET /root/initialized
///
/// Check if the server has been initialized
pub async fn is_initialized(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
) -> HttpResult<IsInitializedResponse> {
    let initialized = docbox_management::root::initialize::is_initialized(db_provider.as_ref())
        .await
        .map_err(anyhow::Error::new)?;
    Ok(Json(IsInitializedResponse { initialized }))
}

/// POST /root/initialize
///
/// - Create the root database
/// - Setup the root database role
/// - Store the root database credentials
/// - Setup the root database
pub async fn initialize(
    Extension(database_config): Extension<Arc<DatabaseConfig>>,
    Extension(secrets): Extension<Arc<SecretManager>>,
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
) -> Result<StatusCode, DynHttpError> {
    docbox_management::root::initialize::initialize(
        db_provider.as_ref(),
        &secrets,
        &database_config.root_secret_name,
    )
    .await
    .map_err(anyhow::Error::new)?;
    Ok(StatusCode::CREATED)
}

/// GET /root/migrations
///
/// Get all tenants and any pending migrations that hey have
pub async fn get_pending_migrations(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
) -> HttpResult<Vec<TenantWithMigrations>> {
    let tenants = docbox_management::tenant::get_tenants::get_tenants(db_provider.as_ref())
        .await
        .map_err(anyhow::Error::new)?;

    let tenant_with_migrations = tenants
        .into_iter()
        .map(|tenant|{
            let db_provider = db_provider.clone();
            async move {
                let pending = docbox_management::tenant::get_pending_tenant_migrations::get_pending_tenant_migrations(db_provider.as_ref(), &tenant).await?;

                anyhow::Ok(TenantWithMigrations{
                    tenant,
                    migrations: pending
                })
            }
        })
        .collect::<FuturesOrdered<_>>()
        .try_collect::<Vec<TenantWithMigrations>>()
        .await?;

    Ok(Json(tenant_with_migrations))
}

/// POST /root/migrate
///
/// Applies migrations against all tenants
pub async fn migrate(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Json(migrate): Json<MigrateTenantsConfig>,
) -> Result<StatusCode, DynHttpError> {
    let outcome =
        docbox_management::tenant::migrate_tenants::migrate_tenants(db_provider.as_ref(), migrate)
            .await
            .map_err(anyhow::Error::new)?;

    tracing::debug!(?outcome, "completed migrations");
    Ok(StatusCode::OK)
}
