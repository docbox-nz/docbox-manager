use docbox_database::models::tenant::TenantId;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct MigrateRequest {
    pub env: String,
    pub tenant_id: Option<TenantId>,
    pub skip_failed: bool,
}

#[derive(Deserialize)]
pub struct InitializeRequest {
    /// Name to give the root database user
    #[serde(default = "default_root_role_name")]
    pub root_role_name: String,

    /// Password to give the root database user
    pub root_role_password: String,
}

fn default_root_role_name() -> String {
    "docbox_config_api".to_string()
}
