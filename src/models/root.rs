use docbox_database::models::tenant::TenantId;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct MigrateRequest {
    pub env: String,
    pub tenant_id: Option<TenantId>,
    pub skip_failed: bool,
}
