import { useQuery } from "@tanstack/react-query";
import { rootKeys } from "./root.keys";
import { isInitialized } from "./root.requests";

export function useInitialized() {
  return useQuery({
    queryKey: rootKeys.isInitialized,
    queryFn: isInitialized,
  });
}
