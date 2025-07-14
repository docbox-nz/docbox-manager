use serde::Serialize;

#[derive(Serialize)]
pub struct IsInitializedResponse {
    pub initialized: bool,
}
