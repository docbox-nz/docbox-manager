import { useDocboxClient } from "@/components/DocboxProvider";
import { useQuery } from "@tanstack/react-query";
import { docboxKeys } from "./docbox.keys";
import type { DocumentBoxesQuery } from "./docbox.types";
import { getDocumentBoxes } from "./docbox.requests";

export function useDocumentBoxes(query: DocumentBoxesQuery) {
  const client = useDocboxClient();

  return useQuery({
    queryKey: docboxKeys.instance(client).boxes.query(query),
    queryFn: () => getDocumentBoxes(client, query),
  });
}
