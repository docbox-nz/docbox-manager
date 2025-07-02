use anyhow::Context;
use serde::Deserialize;

pub struct ServerPassword(pub String);

impl ServerPassword {
    pub fn from_env() -> anyhow::Result<ServerPassword> {
        let password = std::env::var("DOCBOX_MANAGER_PASSWORD")
            .context("missing DOCBOX_MANAGER_PASSWORD environment variable")?;
        Ok(ServerPassword(password))
    }
}

#[derive(Clone, Deserialize)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,

    pub username: String,
    pub password: String,

    pub root_secret_name: String,
}

impl DatabaseConfig {
    pub fn from_env() -> anyhow::Result<DatabaseConfig> {
        let host = std::env::var("DOCBOX_DATABASE_HOST")
            .context("missing DOCBOX_DATABASE_HOST environment variable")?;
        let port = std::env::var("DOCBOX_DATABASE_PORT")
            .context("missing DOCBOX_DATABASE_PORT environment variable")?;
        let port: u16 = port.parse().context("invalid DOCBOX_DATABASE_PORT value")?;

        let username = std::env::var("DOCBOX_DATABASE_USERNAME")
            .context("missing DOCBOX_DATABASE_USERNAME environment variable")?;
        let password = std::env::var("DOCBOX_DATABASE_PASSWORD")
            .context("missing DOCBOX_DATABASE_USERNAME environment variable")?;

        let root_secret_name = std::env::var("DOCBOX_DB_CREDENTIAL_NAME")
            .unwrap_or_else(|_| "postgres/docbox/config".to_string());

        Ok(DatabaseConfig {
            host,
            port,
            username,
            password,
            root_secret_name,
        })
    }
}
