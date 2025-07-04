import { useQuery } from "@tanstack/react-query";
import { tenantKeys } from "./tenant.keys";
import { getTenant, getTenants } from "./tenant.requests";

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.tenants,
    queryFn: getTenants,
  });
}

export function useTenant(env: string, tenantId: string) {
  return useQuery({
    queryKey: tenantKeys.tenant(env, tenantId),
    queryFn: () => getTenant(env, tenantId),
  });
}
