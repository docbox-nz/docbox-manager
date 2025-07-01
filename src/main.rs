use std::{
    net::{Ipv4Addr, SocketAddr, SocketAddrV4},
    sync::Arc,
};

use anyhow::Context;
use axum::{Extension, Router};
use docbox_database::{DbResult, PgConnectOptions, PgPool};
use tower_http::trace::TraceLayer;

use crate::{config::Config, routes::router};

mod config;
mod error;
mod models;
mod routes;

/// Default server address when not specified
const DEFAULT_SERVER_ADDRESS: SocketAddr =
    SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, 8080));

fn main() -> anyhow::Result<()> {
    _ = dotenvy::dotenv();

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("Failed building the Runtime")
        .block_on(server())
}

async fn server() -> anyhow::Result<()> {
    // Load the create tenant config
    let config_raw = tokio::fs::read("config.json").await?;
    let config: Config = serde_json::from_slice(&config_raw).context("failed to parse config")?;

    // Setup router
    let app = router();

    // Determine the socket address to bind against
    let server_address = std::env::var("SERVER_ADDRESS")
        .ok()
        .and_then(|value| value.parse::<SocketAddr>().ok())
        .unwrap_or(DEFAULT_SERVER_ADDRESS);

    // Setup app layers and extension
    let app = app
        .layer(Extension(Arc::new(config)))
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

async fn connect_db(
    host: &str,
    port: u16,
    username: &str,
    password: &str,
    database: &str,
) -> DbResult<PgPool> {
    let options = PgConnectOptions::new()
        .host(host)
        .port(port)
        .username(username)
        .password(password)
        .database(database);

    PgPool::connect_with(options).await
}
