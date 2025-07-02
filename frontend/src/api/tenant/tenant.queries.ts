import { useQuery } from "@tanstack/react-query";
import { tenantKeys } from "./tenant.keys";
import { getTenants } from "./tenant.requests";

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.tenants,
    queryFn: getTenants,
  });
}
