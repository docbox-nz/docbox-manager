import type { DocboxClient } from "@docbox-nz/docbox-sdk";
import type { DocumentBoxesQuery, DocumentBoxesResponse } from "./docbox.types";

export function getDocumentBoxes(
  client: DocboxClient,
  query: DocumentBoxesQuery
) {
  return client.httpPost<DocumentBoxesResponse>("/admin/boxes", query);
}
