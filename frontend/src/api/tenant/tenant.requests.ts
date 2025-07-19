import { httpGet, httpPost } from "../axios";
import type { CreateTenant, Tenant } from "./tenant.types";

export function getTenants() {
  return httpGet<Tenant[]>("/tenant");
}

export function getTenant(env: string, tenantId: string) {
  return httpGet<Tenant>(`/tenant/${env}/${tenantId}`);
}

export function createTenant(request: CreateTenant) {
  return httpPost("/tenant", request);
}

export function migrateTenant(env: string, tenantId: string) {
  return httpPost(`/tenant/${env}/${tenantId}/migrate`);
}
