use axum::{
    Router,
    routing::{get, post},
};

pub mod root;
pub mod tenant;

pub fn router() -> Router {
    Router::new()
        .nest("/tenant", tenant_router())
        .nest("/root", root_router())
}

pub fn root_router() -> Router {
    Router::new()
        .route("/initialized", get(root::is_initialized))
        .route("/initialize", post(root::initialize))
        .route("/migrate", post(root::migrate))
}

pub fn tenant_router() -> Router {
    Router::new()
        .route("/", get(tenant::get_all).post(tenant::create))
        .route(
            "/{env}/{tenant_id}",
            get(tenant::get).delete(tenant::delete),
        )
}
