use axum::{
    extract::{FromRequestParts, Request},
    http::{self, StatusCode},
    middleware::Next,
    response::Response,
};
use http::request::Parts;
use rand::{Rng, distributions::Alphanumeric, rngs::OsRng};
use serde::{Deserialize, Serialize};
use tower_sessions::Session;

const AUTH_KEY: &str = "counter";

#[derive(Default, Deserialize, Serialize)]
pub struct Authenticated;

impl<S> FromRequestParts<S> for Authenticated
where
    S: Send + Sync,
{
    type Rejection = (http::StatusCode, &'static str);

    async fn from_request_parts(req: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let session = Session::from_request_parts(req, state).await?;
        if !is_session_authenticated(&session).await.map_err(|error| {
            tracing::error!(?error, "failed to get session");
            (StatusCode::INTERNAL_SERVER_ERROR, "failed to get session")
        })? {
            return Err((StatusCode::UNAUTHORIZED, "Not authenticated"));
        }

        Ok(Authenticated)
    }
}

pub async fn is_session_authenticated(session: &Session) -> anyhow::Result<bool> {
    let authenticated = session
        .get::<bool>(AUTH_KEY)
        .await
        .map(|value| value.is_some())?;
    Ok(authenticated)
}

pub async fn set_session_authenticated(
    session: &Session,
    authenticated: bool,
) -> anyhow::Result<()> {
    if authenticated {
        session.insert(AUTH_KEY, true).await?;
    } else {
        session.remove::<bool>(AUTH_KEY).await?;
    }
    Ok(())
}

pub async fn auth_middleware(
    session: Session,
    request: Request,
    next: Next,
) -> Result<Response, (http::StatusCode, &'static str)> {
    if !is_session_authenticated(&session).await.map_err(|error| {
        tracing::error!(?error, "failed to get session");
        (StatusCode::INTERNAL_SERVER_ERROR, "failed to get session")
    })? {
        return Err((StatusCode::UNAUTHORIZED, "Not authenticated"));
    }

    Ok(next.run(request).await)
}

/// Generates a random password
pub fn random_password(length: usize) -> anyhow::Result<String> {
    let mut rng = OsRng;
    let mut password: Vec<u8> = Vec::with_capacity(length);

    for _ in 0..length {
        password.push(rng.sample(Alphanumeric));
    }

    Ok(String::from_utf8(password)?)
}
