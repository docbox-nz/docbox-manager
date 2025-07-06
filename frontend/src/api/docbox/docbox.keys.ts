import { DocboxClient } from "@docbox-nz/docbox-sdk";
import type { DocumentBoxesQuery } from "./docbox.types";

export const docboxKeys = {
  root: ["docbox"],
  instance: (client: DocboxClient) => ({
    root: ["docbox", client],
    boxes: {
      root: ["docbox", client, "boxes"],
      query: (query: DocumentBoxesQuery) => ["docbox", client, "boxes", query],
      create: ["docbox", client, "box", "create"],
      specific: {
        root: (scope: string | null | undefined) => [
          "docbox",
          client,
          "box",
          scope,
        ],

        stats: (scope: string | null | undefined) => [
          "docbox",
          client,
          "box",
          scope,
          "stats",
        ],
      },
    },
  }),
};
