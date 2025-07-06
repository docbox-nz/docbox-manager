import { DocboxClient, GeneratedFileType } from "@docbox-nz/docbox-sdk";
import type { DocumentBoxesQuery } from "./docbox.types";

export const docboxKeys = {
  root: ["docbox"],
  instance: (client: DocboxClient) => ({
    root: ["docbox", client],

    // Document boxes
    boxes: {
      root: ["docbox", client, "boxes"],

      query: (query: DocumentBoxesQuery) => ["docbox", client, "boxes", query],

      // Document box
      specific: (scope: string | null | undefined) => ({
        root: ["docbox", client, "box", scope],
        search: {
          root: ["docbox", client, "box", scope, "search"],
        },
        stats: ["docbox", client, "box", scope, "stats"],

        // Folder keys
        folder: {
          root: ["docbox", client, "box", "folder"],
          specific: (folderId: string | null | undefined) => ({
            root: ["docbox", client, "box", "folder", folderId],
            editHistory: [
              "docbox",
              client,
              "box",
              "folder",
              folderId,
              "edit-history",
            ],
          }),
        },

        // Link keys
        link: {
          root: ["docbox", client, "box", "link"],
          specific: (linkId: string | null | undefined) => ({
            root: ["docbox", client, "box", "link", linkId],
            editHistory: [
              "docbox",
              client,
              "box",
              "link",
              linkId,
              "edit-history",
            ],
            metadata: ["docbox", client, "box", "link", linkId, "metadata"],
          }),
        },

        // File keys
        file: {
          root: ["docbox", client, "box", "file"],
          specific: (fileId: string | null | undefined) => ({
            root: ["docbox", client, "box", "file", fileId],
            editHistory: [
              "docbox",
              client,
              "box",
              "file",
              fileId,
              "edit-history",
            ],
            raw: ["docbox", client, "box", "file", fileId, "raw"],
            children: ["docbox", client, "box", "file", fileId, "children"],
            search: {
              raw: ["docbox", client, "box", "file", fileId, "search"],
            },
            generated: {
              root: ["docbox", client, "box", "file", fileId, "generated"],
              specific: (type: GeneratedFileType | null | undefined) => ({
                root: [
                  "docbox",
                  client,
                  "box",
                  "file",
                  fileId,
                  "generated",
                  type,
                ],
                raw: [
                  "docbox",
                  client,
                  "box",
                  "file",
                  fileId,
                  "generated",
                  type,
                ],
              }),
            },
          }),
        },
      }),
    },
  }),
};
