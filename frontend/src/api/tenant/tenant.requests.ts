import { httpGet, httpPost } from "../axios";
import type { CreateTenant, Tenant } from "./tenant.types";

export function getTenants() {
  return httpGet<Tenant[]>("/tenant");
}

export function createTenant(request: CreateTenant) {
  return httpPost("/tenant", request);
}
