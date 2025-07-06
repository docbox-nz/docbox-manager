use std::sync::Arc;

use anyhow::Context;
use axum::{
    Extension, Json,
    body::{Body, to_bytes},
    extract::{Path, Request},
    http::StatusCode,
    response::Response,
};
use docbox_core::{secrets::AppSecretManager, storage::StorageLayerFactory};
use docbox_database::{
    ROOT_DATABASE_NAME,
    create::{create_database, create_restricted_role},
    models::tenant::Tenant,
    sqlx::types::Uuid,
};
use docbox_search::SearchIndexFactory;
use futures::TryStreamExt;
use reqwest::Client;
use serde_json::json;

use crate::{
    DatabaseProvider, auth::random_password, config::DocboxServerUrl, error::DynHttpError,
    models::tenant::CreateTenant,
};

/// POST /tenant
///
/// Create a new tenant
pub async fn create(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Extension(search_factory): Extension<Arc<SearchIndexFactory>>,
    Extension(storage_factory): Extension<Arc<StorageLayerFactory>>,
    Extension(secrets): Extension<Arc<AppSecretManager>>,
    Json(tenant_config): Json<CreateTenant>,
) -> Result<StatusCode, DynHttpError> {
    tracing::debug!(?tenant_config, "creating tenant");

    // Connect to the "postgres" database to use while creating the tenant database
    let db_postgres = db_provider
        .connect("postgres")
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
    let root_db = db_provider
        .connect(ROOT_DATABASE_NAME)
        .await
        .context("failed to connect to root database")?;

    // Connect to the tenant database
    let tenant_db = db_provider
        .connect(&tenant_config.db_name)
        .await
        .context("failed to connect to tenant database")?;

    // Generate password for the database role
    let db_role_password = random_password(30).context("failed to generate password")?;

    // Setup the tenant user
    create_restricted_role(
        &tenant_db,
        &tenant_config.db_name,
        &tenant_config.db_role_name,
        &db_role_password,
    )
    .await
    .context("failed to setup tenant user")?;
    tracing::info!("created tenant user");

    // Create and store the new database secret
    let secret_value = serde_json::to_string(&json!({
        "username": tenant_config.db_role_name,
        "password": db_role_password
    }))
    .context("failed to encode secret")?;

    secrets
        .create_secret(&tenant_config.db_secret_name, &secret_value)
        .await?;

    tracing::info!("created database secret");

    // Attempt to initialize the tenant
    let tenant = docbox_core::tenant::create_tenant::create_tenant(
        &root_db,
        &tenant_db,
        &search_factory,
        &storage_factory,
        docbox_core::tenant::create_tenant::CreateTenant {
            id: tenant_config.id,
            name: tenant_config.name,
            db_name: tenant_config.db_name,
            db_secret_name: tenant_config.db_secret_name,
            s3_name: tenant_config.storage_bucket_name,
            os_index_name: tenant_config.search_index_name,
            event_queue_url: tenant_config.event_queue_url,
            origins: tenant_config.storage_cors_origins,
            s3_queue_arn: tenant_config.storage_s3_queue_arn,
            env: tenant_config.env,
        },
    )
    .await
    .context("failed to create tenant")?;

    tracing::info!(?tenant, "tenant created successfully");

    Ok(StatusCode::CREATED)
}

/// GET /tenant
///
/// Get all tenants
pub async fn get_all(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
) -> Result<Json<Vec<Tenant>>, DynHttpError> {
    // Connect to the docbox database
    let db_docbox = db_provider
        .connect(ROOT_DATABASE_NAME)
        .await
        .context("failed to connect to docbox database")?;

    // Get the tenant details
    let tenant = Tenant::all(&db_docbox)
        .await
        .context("failed to request tenants")?;
    tracing::debug!(?tenant, "found tenant");

    Ok(Json(tenant))
}

/// GET /tenant/{env}/{id}
///
/// Get a specific tenant
pub async fn get(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Path((env, tenant_id)): Path<(String, Uuid)>,
) -> Result<Json<Tenant>, DynHttpError> {
    // Connect to the docbox database
    let db_docbox = db_provider
        .connect(ROOT_DATABASE_NAME)
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

/// DELETE /tenant/{env}/{id}
///
/// Delete a specific tenant
pub async fn delete(
    Extension(db_provider): Extension<Arc<DatabaseProvider>>,
    Path((env, tenant_id)): Path<(String, Uuid)>,
) -> Result<StatusCode, DynHttpError> {
    // Connect to the docbox database
    let db_docbox = db_provider
        .connect(ROOT_DATABASE_NAME)
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

    let stream = resp.bytes_stream().map_err(|e| std::io::Error::other(e));
    let body = Body::from_stream(stream);

    let response = response_builder
        .body(body)
        .inspect_err(|error| tracing::error!(?error, "failed to create response"))
        .context("failed to create response")?;

    tracing::debug!("HERES THE RESPONSE");

    Ok(response)
}
