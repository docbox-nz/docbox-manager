import { useMutation } from "@tanstack/react-query";
import { rootKeys } from "./root.keys";
import { initializeRoot, migrateTenants } from "./root.requests";
import { queryClient } from "@/integrations/tanstack-query/root-provider";

export function useInitialize() {
  return useMutation({
    mutationKey: rootKeys.initialize,
    mutationFn: initializeRoot,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: rootKeys.isInitialized });
    },
  });
}

export function useMigrateTenants() {
  return useMutation({
    mutationKey: rootKeys.migrate,
    mutationFn: migrateTenants,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: rootKeys.migrations });
    },
  });
}
