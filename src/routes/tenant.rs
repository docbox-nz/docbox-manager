use crate::{config::DocboxServerUrl, database::DatabaseProvider, error::DynHttpError};
use anyhow::Context;
use axum::{
    Extension, Json,
    body::{Body, to_bytes},
    extract::{Path, Request},
    http::StatusCode,
    response::Response,
};
use docbox_core::{secrets::AppSecretManager, storage::StorageLayerFactory};
use docbox_database::{models::tenant::Tenant, sqlx::types::Uuid};
use docbox_management::tenant::create_tenant::CreateTenantConfig;
use docbox_search::SearchIndexFactory;
use futures::TryStreamExt;
use reqwest::Client;
use std::sync::Arc;

/// POST /tenant
///
/// Create a new tenant
pub async fn create(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Extension(search_factory): Extension<Arc<SearchIndexFactory>>,
    Extension(storage_factory): Extension<Arc<StorageLayerFactory>>,
    Extension(secrets): Extension<Arc<AppSecretManager>>,
    Json(config): Json<CreateTenantConfig>,
) -> Result<StatusCode, DynHttpError> {
    tracing::debug!(?config, "creating tenant");
    let tenant = docbox_management::tenant::create_tenant::create_tenant(
        db_provider.as_ref(),
        &search_factory,
        &storage_factory,
        &secrets,
        config,
    )
    .await
    .map_err(anyhow::Error::new)?;
    tracing::info!(?tenant, "tenant created successfully");
    Ok(StatusCode::CREATED)
}

/// GET /tenant
///
/// Get all tenants
pub async fn get_all(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
) -> Result<Json<Vec<Tenant>>, DynHttpError> {
    let tenants = docbox_management::tenant::get_tenants::get_tenants(db_provider.as_ref())
        .await
        .map_err(anyhow::Error::new)?;
    Ok(Json(tenants))
}

/// GET /tenant/{env}/{id}
///
/// Get a specific tenant
pub async fn get(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Path((env, tenant_id)): Path<(String, Uuid)>,
) -> Result<Json<Tenant>, DynHttpError> {
    let tenant =
        docbox_management::tenant::get_tenant::get_tenant(db_provider.as_ref(), &env, tenant_id)
            .await
            .map_err(anyhow::Error::new)?
            .context("tenant not found")?;
    Ok(Json(tenant))
}

/// DELETE /tenant/{env}/{id}
///
/// Delete a specific tenant
pub async fn delete(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Path((env, tenant_id)): Path<(String, Uuid)>,
) -> Result<StatusCode, DynHttpError> {
    docbox_management::tenant::delete_tenant::delete_tenant(db_provider.as_ref(), &env, tenant_id)
        .await
        .map_err(anyhow::Error::new)?;
    Ok(StatusCode::OK)
}

/// POST /tenant/{env}/{id}/migrate
///
/// Applies migrations against the tenant
pub async fn migrate(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Path((env, tenant_id)): Path<(String, Uuid)>,
) -> Result<StatusCode, DynHttpError> {
    let tenant =
        docbox_management::tenant::get_tenant::get_tenant(db_provider.as_ref(), &env, tenant_id)
            .await
            .map_err(anyhow::Error::new)?
            .context("tenant not found")?;

    docbox_management::tenant::migrate_tenant::migrate_tenant(db_provider.as_ref(), &tenant, None)
        .await
        .map_err(anyhow::Error::new)?;

    Ok(StatusCode::OK)
}

/// ANY /tenant/{env}/{id}/gateway/{*tail}
///
/// Gateway to request resources from the docbox server
pub async fn docbox_gateway(
    Path((env, tenant_id, tail)): Path<(String, Uuid, String)>,
    Extension(docbox_server): Extension<Arc<DocboxServerUrl>>,
    request: Request,
) -> Result<Response, DynHttpError> {
    let (parts, body) = request.into_parts();

    // Read the full body
    let body_bytes = to_bytes(body, usize::MAX)
        .await
        .inspect_err(|error| tracing::error!(?error, "failed to read request body"))
        .context("Failed to ready body")?;

    // Rebuild the URI without the stripped prefix
    let query = parts
        .uri
        .query()
        .map(|q| format!("?{}", q))
        .unwrap_or_default();
    let new_uri = format!("{}{}{}", docbox_server.0, tail, query);

    tracing::debug!(?new_uri, ?env, ?tenant_id, "forwarding request");

    let client = Client::new();

    // Build the request with headers and body
    let mut req_builder = client
        .request(parts.method.clone(), new_uri)
        .body(body_bytes);

    if let Some(header) = parts.headers.get("accept") {
        req_builder = req_builder.header(hyper::header::ACCEPT, header);
    }
    if let Some(header) = parts.headers.get("content-type") {
        req_builder = req_builder.header(hyper::header::CONTENT_TYPE, header);
    }
    if let Some(header) = parts.headers.get("content-length") {
        req_builder = req_builder.header(hyper::header::CONTENT_LENGTH, header);
    }

    let resp = req_builder
        .header("x-tenant-env", env)
        .header("x-tenant-id", tenant_id.to_string())
        .send()
        .await
        .inspect_err(|error| tracing::error!(?error, "failed to request docbox"))
        .context("failed to request docbox")?;

    // Build axum response
    let mut response_builder = Response::builder().status(resp.status());

    for (key, value) in resp.headers().iter() {
        response_builder = response_builder.header(key, value);
    }

    let stream = resp.bytes_stream().map_err(std::io::Error::other);
    let body = Body::from_stream(stream);

    let response = response_builder
        .body(body)
        .inspect_err(|error| tracing::error!(?error, "failed to create response"))
        .context("failed to create response")?;

    tracing::debug!("HERES THE RESPONSE");

    Ok(response)
}
