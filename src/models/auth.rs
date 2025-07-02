use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct IsAuthenticatedResponse {
    pub authenticated: bool,
}

#[derive(Deserialize)]
pub struct AuthenticateRequest {
    pub password: String,
}
