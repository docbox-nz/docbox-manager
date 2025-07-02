use std::sync::Arc;

use axum::{Extension, Json, http::StatusCode};
use tower_sessions::Session;

use crate::{
    auth::{is_session_authenticated, set_session_authenticated},
    config::ServerPassword,
    error::HttpResult,
    models::auth::{AuthenticateRequest, IsAuthenticatedResponse},
};

/// GET /auth/is-authenticated
///
/// Check if the current user is authenticated
pub async fn is_authenticated(session: Session) -> HttpResult<IsAuthenticatedResponse> {
    let authenticated = is_session_authenticated(&session).await?;
    Ok(Json(IsAuthenticatedResponse { authenticated }))
}

/// POST /auth/authenticate
///
/// Authenticate with a password
pub async fn authenticate(
    session: Session,
    Extension(server_password): Extension<Arc<ServerPassword>>,
    Json(req): Json<AuthenticateRequest>,
) -> Result<StatusCode, (StatusCode, &'static str)> {
    if req.password != server_password.0 {
        return Err((StatusCode::BAD_REQUEST, "incorrect password"));
    }

    set_session_authenticated(&session, true)
        .await
        .map_err(|error| {
            tracing::error!(?error, "failed to set session state");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "failed to set session state",
            )
        })?;

    Ok(StatusCode::OK)
}

/// POST /auth/logout
///
/// Logout the current session
pub async fn logout(session: Session) -> Result<StatusCode, (StatusCode, &'static str)> {
    set_session_authenticated(&session, false)
        .await
        .map_err(|error| {
            tracing::error!(?error, "failed to set session state");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "failed to set session state",
            )
        })?;

    Ok(StatusCode::OK)
}
