import { useDocboxClient } from "@/components/DocboxProvider";
import { useQuery } from "@tanstack/react-query";
import { docboxKeys } from "./docbox.keys";
import type { DocumentBoxesQuery } from "./docbox.types";
import { getDocumentBoxes } from "./docbox.requests";
import { isNil } from "@/utils/nullable";

export function useDocumentBoxes(query: DocumentBoxesQuery) {
  const client = useDocboxClient();

  return useQuery({
    queryKey: docboxKeys.instance(client).boxes.query(query),
    queryFn: () => getDocumentBoxes(client, query),
  });
}

export function useDocumentBox(scope: string | null | undefined) {
  const client = useDocboxClient();

  return useQuery({
    enabled: !isNil(scope),
    queryKey: docboxKeys.instance(client).boxes.specific(scope).root,
    queryFn: () => client.documentBox.get(scope!),
  });
}

export function useFolder(
  scope: string | null | undefined,
  folderId: string | null | undefined
) {
  const client = useDocboxClient();

  return useQuery({
    enabled: !isNil(scope) && !isNil(folderId),
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .folder.specific(folderId).root,
    queryFn: () => client.folder.get(scope!, folderId!),
  });
}
