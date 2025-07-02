export interface Tenant {
  id: string;
  name: string;
  db_name: string;
  db_secret_name: string;
  s3_name: string;
  os_index_name: string;
  env: string;
  event_queue_url: string;
}
