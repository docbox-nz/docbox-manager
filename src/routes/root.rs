use crate::{
    config::DatabaseConfig,
    database::DatabaseProvider,
    error::{DynHttpError, HttpResult},
    models::root::IsInitializedResponse,
};
use axum::{Extension, Json, http::StatusCode};
use docbox_core::secrets::AppSecretManager;
use docbox_management::tenant::migrate_tenants::MigrateTenantsConfig;
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
    Extension(secrets): Extension<Arc<AppSecretManager>>,
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
