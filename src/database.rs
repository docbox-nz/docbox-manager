use docbox_database::{DbResult, PgConnectOptions, PgPool};

use crate::config::DatabaseConfig;

pub struct DatabaseProvider {
    pub config: DatabaseConfig,
}

impl docbox_management::database::DatabaseProvider for DatabaseProvider {
    fn connect(
        &self,
        database: &str,
    ) -> impl Future<Output = DbResult<docbox_database::DbPool>> + Send {
        let options = PgConnectOptions::new()
            .host(&self.config.host)
            .port(self.config.port)
            .username(&self.config.username)
            .password(&self.config.password)
            .database(database);

        PgPool::connect_with(options)
    }
}
