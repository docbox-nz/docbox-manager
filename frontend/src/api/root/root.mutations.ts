import { useMutation } from "@tanstack/react-query";
import { rootKeys } from "./root.keys";
import { initializeRoot } from "./root.requests";

export function useInitialize() {
  return useMutation({
    mutationKey: rootKeys.initialize,
    mutationFn: initializeRoot,
  });
}
