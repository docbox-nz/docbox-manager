import { useMutation } from "@tanstack/react-query";
import { authKeys } from "./auth.keys";
import { authenticate, logout } from "./auth.requests";
import { queryClient } from "@/integrations/tanstack-query/root-provider";

export function useAuthenticate() {
  return useMutation({
    mutationKey: authKeys.authenticate,
    mutationFn: ({ password }: { password: string }) => authenticate(password),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: authKeys.isAuthenticated });
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationKey: authKeys.logout,
    mutationFn: logout,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: authKeys.isAuthenticated });
    },
  });
}
