import { useMutation } from "@tanstack/react-query";
import { docboxKeys } from "./docbox.keys";
import { useDocboxClient } from "@/components/DocboxProvider";
import { queryClient } from "@/integrations/tanstack-query/root-provider";

export function useCreateDocumentBox() {
  const client = useDocboxClient();
  return useMutation({
    mutationFn: ({ scope }: { scope: string }) =>
      client.documentBox.create(scope, false),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: docboxKeys.instance(client).boxes.root,
      });
    },
  });
}
