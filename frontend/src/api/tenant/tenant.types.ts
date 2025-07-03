export interface Tenant {
  id: string;
  name: string;
  env: string;

  db_name: string;
  db_secret_name: string;

  s3_name: string;
  os_index_name: string;
  event_queue_url: string;
}

export interface CreateTenant {
  id: string;
  name: string;
  env: string;

  db_name: string;
  db_secret_name: string;
  db_role_name: string;

  storage_bucket_name: string;
  storage_s3_queue_arn?: string | null;
  storage_cors_origins: string[];

  search_index_name: string;
  event_queue_url?: string | null;
}
