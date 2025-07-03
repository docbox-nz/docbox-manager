use docbox_database::models::tenant::TenantId;
use serde::Deserialize;

/// Request to create a tenant
#[derive(Debug, Deserialize)]
pub struct CreateTenant {
    /// Unique ID for the tenant
    pub id: TenantId,
    pub name: String,
    pub env: String,

    /// Database name for the tenant
    pub db_name: String,
    /// Database secret credentials name for the tenant
    /// (Where the username and password will be stored/)
    pub db_secret_name: String,
    /// Name for the tenant role
    pub db_role_name: String,

    /// Name of the tenant s3 bucket
    pub storage_bucket_name: String,
    /// CORS Origins for setting up presigned uploads with S3
    pub storage_cors_origins: Vec<String>,
    /// ARN for the S3 queue to publish S3 notifications, required
    /// for presigned uploads
    pub storage_s3_queue_arn: Option<String>,

    /// Name of the tenant search index
    pub search_index_name: String,

    /// URL for the SQS event queue
    pub event_queue_url: Option<String>,
}
