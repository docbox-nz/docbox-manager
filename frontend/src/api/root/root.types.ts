import type { Tenant } from "../tenant/tenant.types";

export interface IsInitializedResponse {
  initialized: boolean;
}

export type MigrationsResponse = TenantWithMigrations[];

export interface TenantWithMigrations {
  tenant: Tenant;
  migrations: string[];
}
