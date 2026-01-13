use crate::{
    config::{DatabaseConfig, DocboxServerUrl, ServerPassword},
    database::DatabaseProvider,
    routes::router,
};
use axum::Extension;
use docbox_core::aws::aws_config;
use docbox_database::{DatabasePoolCache, DatabasePoolCacheConfig};
use docbox_search::{SearchIndexFactory, SearchIndexFactoryConfig};
use docbox_secrets::{SecretManager, SecretsManagerConfig};
use docbox_storage::{StorageLayerFactory, StorageLayerFactoryConfig};
use std::{
    net::{Ipv4Addr, SocketAddr, SocketAddrV4},
    sync::Arc,
};
use tower_http::trace::TraceLayer;
use tower_sessions::{Expiry, MemoryStore, SessionManagerLayer, cookie::time::Duration};

mod auth;
mod config;
mod database;
mod error;
mod logging;
mod models;
mod routes;

/// Default server address when not specified
const DEFAULT_SERVER_ADDRESS: SocketAddr =
    SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, 9090));

fn main() -> anyhow::Result<()> {
    _ = dotenvy::dotenv();

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("Failed building the Runtime")
        .block_on(server())
}

async fn server() -> anyhow::Result<()> {
    logging::init_logging()?;

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(false)
        .with_expiry(Expiry::OnInactivity(Duration::minutes(30)));

    // Load AWS configuration
    let aws_config = aws_config().await;

    let database_config = DatabaseConfig::from_env()?;
    let server_password = ServerPassword::from_env()?;
    let server_url = DocboxServerUrl::from_env()?;

    // Initialize factories
    let secrets = SecretManager::from_config(&aws_config, SecretsManagerConfig::from_env()?);
    let secrets = Arc::new(secrets);

    // Setup database cache / connector
    let db_cache = Arc::new(DatabasePoolCache::from_config(
        DatabasePoolCacheConfig {
            host: database_config.host.clone(),
            port: database_config.port,
            root_secret_name: database_config.root_secret_name.clone(),
            max_connections: None,
        },
        secrets.clone(),
    ));

    let search_factory = SearchIndexFactory::from_config(
        &aws_config,
        secrets.clone(),
        db_cache,
        SearchIndexFactoryConfig::from_env()?,
    )?;
    let storage_factory =
        StorageLayerFactory::from_config(&aws_config, StorageLayerFactoryConfig::from_env()?);
    let database_provider = DatabaseProvider {
        config: database_config.clone(),
    };

    // Setup router
    let app = router();

    // Determine the socket address to bind against
    let server_address = std::env::var("DOCBOX_MANAGER_SERVER_ADDRESS")
        .ok()
        .and_then(|value| value.parse::<SocketAddr>().ok())
        .unwrap_or(DEFAULT_SERVER_ADDRESS);

    // Setup app layers and extension
    let app = app
        .layer(Extension(Arc::new(server_url)))
        .layer(Extension(Arc::new(server_password)))
        .layer(Extension(Arc::new(database_config)))
        .layer(Extension(Arc::new(database_provider)))
        .layer(Extension(Arc::new(secrets)))
        .layer(Extension(Arc::new(search_factory)))
        .layer(Extension(Arc::new(storage_factory)))
        .layer(session_layer)
        .layer(TraceLayer::new_for_http());

    // Development mode CORS access for local browser testing
    #[cfg(debug_assertions)]
    let app = app.layer(tower_http::cors::CorsLayer::very_permissive());

    // Bind the TCP listener for the HTTP server
    let listener = tokio::net::TcpListener::bind(server_address).await?;

    // Log the startup message
    tracing::debug!("server started on {server_address}");

    // Serve the app
    axum::serve(listener, app)
        // Attach graceful shutdown to the shutdown receiver
        .with_graceful_shutdown(async move {
            _ = tokio::signal::ctrl_c().await;
        })
        .await?;

    Ok(())
}
