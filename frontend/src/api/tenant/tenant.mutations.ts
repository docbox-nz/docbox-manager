import { useMutation } from "@tanstack/react-query";
import { tenantKeys } from "./tenant.keys";
import { createTenant } from "./tenant.requests";
import { queryClient } from "@/integrations/tanstack-query/root-provider";

export function useCreateTenant() {
  return useMutation({
    mutationKey: tenantKeys.createTenant,
    mutationFn: createTenant,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: tenantKeys.tenants });
    },
  });
}
