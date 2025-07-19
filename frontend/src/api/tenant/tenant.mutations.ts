import { useMutation } from "@tanstack/react-query";
import { tenantKeys } from "./tenant.keys";
import { createTenant, migrateTenant } from "./tenant.requests";
import { queryClient } from "@/integrations/tanstack-query/root-provider";
import { rootKeys } from "../root/root.keys";

export function useCreateTenant() {
  return useMutation({
    mutationKey: tenantKeys.createTenant,
    mutationFn: createTenant,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: tenantKeys.tenants });
    },
  });
}

export function useMigrateTenant() {
  return useMutation({
    mutationKey: tenantKeys.migrateTenant,
    mutationFn: ({ env, tenant_id }: { env: string; tenant_id: string }) =>
      migrateTenant(env, tenant_id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: rootKeys.migrations });
    },
  });
}
