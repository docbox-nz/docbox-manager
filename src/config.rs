use docbox_core::{secrets::SecretsManagerConfig, storage::StorageLayerFactoryConfig};
use docbox_search::SearchIndexFactoryConfig;
use serde::Deserialize;

#[derive(Clone, Deserialize)]
pub struct Config {
    pub database: DatabaseConfig,
    pub secrets: SecretsManagerConfig,
    pub search: SearchIndexFactoryConfig,
    pub storage: StorageLayerFactoryConfig,
}

#[derive(Clone, Deserialize)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub setup_user: DatabaseSetupUserConfig,
    pub root_secret_name: String,
    pub root_role_name: String,
    pub root_secret_password: String,
}

#[derive(Clone, Deserialize)]
pub struct DatabaseSetupUserConfig {
    pub username: String,
    pub password: String,
}
