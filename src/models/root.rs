use docbox_database::models::tenant::Tenant;
use serde::Serialize;

#[derive(Serialize)]
pub struct IsInitializedResponse {
    pub initialized: bool,
}

#[derive(Serialize)]
pub struct TenantWithMigrations {
    pub tenant: Tenant,
    pub migrations: Vec<String>,
}
