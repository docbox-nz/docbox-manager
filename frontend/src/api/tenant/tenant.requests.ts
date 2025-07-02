import { httpGet } from "../axios";
import type { Tenant } from "./tenant.types";

export function getTenants() {
  return httpGet<Tenant[]>("/tenant");
}
