use axum::{
    Router,
    routing::{any, get, post},
};

use crate::auth::auth_middleware;

pub mod auth;
pub mod public;
pub mod root;
pub mod tenant;

pub fn router() -> Router {
    Router::new()
        .nest(
            "/api",
            Router::new()
                .nest("/auth", auth_router())
                // Authenticated routes
                .merge(
                    Router::new()
                        .nest("/tenant", tenant_router())
                        .nest("/root", root_router())
                        .layer(axum::middleware::from_fn(auth_middleware)),
                ),
        )
        .fallback_service(public::PublicContent)
}

fn auth_router() -> Router {
    Router::new()
        .route("/is-authenticated", get(auth::is_authenticated))
        .route("/authenticate", post(auth::authenticate))
        .route("/logout", post(auth::logout))
}

fn root_router() -> Router {
    Router::new()
        .route("/initialized", get(root::is_initialized))
        .route("/initialize", post(root::initialize))
        .route("/migrations", get(root::get_pending_migrations))
        .route("/migrate", post(root::migrate))
}

fn tenant_router() -> Router {
    Router::new()
        .route("/", get(tenant::get_all).post(tenant::create))
        .nest(
            "/{env}/{tenant_id}",
            Router::new()
                .route("/", get(tenant::get).delete(tenant::delete))
                .route("/migrate", post(tenant::migrate))
                .route("/gateway/{*tail}", any(tenant::docbox_gateway)),
        )
}
