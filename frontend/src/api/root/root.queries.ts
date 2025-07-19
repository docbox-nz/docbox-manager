import { useQuery } from "@tanstack/react-query";
import { rootKeys } from "./root.keys";
import { getMigrations, isInitialized } from "./root.requests";

export function useInitialized() {
  return useQuery({
    queryKey: rootKeys.isInitialized,
    queryFn: isInitialized,
    select: (data) => data.initialized,
  });
}

export function useMigrations() {
  return useQuery({
    queryKey: rootKeys.migrations,
    queryFn: getMigrations,
  });
}
