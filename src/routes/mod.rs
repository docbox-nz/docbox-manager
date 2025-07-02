use axum::{
    Router,
    routing::{get, post},
};

use crate::auth::auth_middleware;

pub mod auth;
pub mod root;
pub mod tenant;

pub fn router() -> Router {
    Router::new()
        .nest("/auth", auth_router())
        // Authenticated routes
        .merge(
            Router::new()
                .nest("/tenant", tenant_router())
                .nest("/root", root_router())
                .layer(axum::middleware::from_fn(auth_middleware)),
        )
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
        .route("/migrate", post(root::migrate))
}

fn tenant_router() -> Router {
    Router::new()
        .route("/", get(tenant::get_all).post(tenant::create))
        .route(
            "/{env}/{tenant_id}",
            get(tenant::get).delete(tenant::delete),
        )
    // TODO: Docbox forwarding route
}
