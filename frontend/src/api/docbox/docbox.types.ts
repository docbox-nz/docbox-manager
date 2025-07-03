import type { DocumentBox } from "@docbox-nz/docbox-sdk";

export interface DocumentBoxesQuery {
  offset: number;
  limit: number;
}

export interface DocumentBoxesResponse {
  results: DocumentBox[];
}
