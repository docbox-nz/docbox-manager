import { useQuery } from "@tanstack/react-query";
import { authKeys } from "./auth.keys";
import { isAuthenticated } from "./auth.requests";

export function useAuthenticated() {
  return useQuery({
    queryKey: authKeys.isAuthenticated,
    queryFn: isAuthenticated,
    select: (data) => data.authenticated,
  });
}
