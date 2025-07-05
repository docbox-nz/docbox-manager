import { useMutation } from "@tanstack/react-query";
import { docboxKeys } from "./docbox.keys";
import { useDocboxClient } from "@/components/DocboxProvider";
import { queryClient } from "@/integrations/tanstack-query/root-provider";
import type {
  DocumentBoxScope,
  FolderId,
  PresignedUploadOptions,
} from "@docbox-nz/docbox-sdk";

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

export function useUploadFile() {
  const client = useDocboxClient();
  return useMutation({
    mutationFn: ({
      scope,
      folder_id,
      file,
      options,
    }: {
      scope: DocumentBoxScope;
      folder_id: FolderId;
      file: File;
      options?: PresignedUploadOptions;
    }) => client.file.uploadPresigned(scope, folder_id, file, options),
    onSuccess: (response, { scope }) => {
      // TODO: Mutate upload complete
    },
  });
}
