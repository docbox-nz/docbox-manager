import { fData } from "@/utils/format-number";
import {
  DocboxItemType,
  type DocboxItem,
  type ResolvedFolder,
} from "@docbox-nz/docbox-sdk";
import { FileTypeIcon, getFileTypeFromMime } from "@docbox-nz/docbox-ui";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import RouterLink from "../RouterLink";

type Props = {
  folder: ResolvedFolder;
};

const columns: GridColDef<DocboxItem>[] = [
  {
    field: "id",
    width: 200,
    headerName: "ID",
  },
  {
    field: "name",
    flex: 1,
    headerName: "Name",
    renderCell({ row }) {
      return (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ height: 1 }}
        >
          {row.type === DocboxItemType.File && (
            <FileTypeIcon
              fileType={getFileTypeFromMime(row.mime)}
              width={32}
              height={32}
            />
          )}

          <Stack>
            <Typography variant="subtitle2">{row.name}</Typography>
            {row.type === DocboxItemType.File && (
              <Typography variant="caption" color="text.secondary">
                {row.mime}
              </Typography>
            )}
          </Stack>
        </Stack>
      );
    },
  },
  {
    field: "size",
    minWidth: 150,
    headerName: "Size",
    valueFormatter: (value) => fData(value),
  },
  {
    field: "hash",
    minWidth: 150,
    headerName: "Hash (SHA256)",
  },
  {
    field: "last_modified_at",
    minWidth: 150,
    headerName: "Last Modified At",
    valueFormatter: (value) => value,
  },
  {
    field: "created_at",
    headerName: "Created At",
    minWidth: 150,
    valueFormatter: (value) => value,
  },
  {
    field: "actions",
    headerName: "Actions",
    renderCell: ({ row }) => (
      <Button
        component={RouterLink}
        to="."
        search={(search) => {
          if (row.type === DocboxItemType.Folder) {
            return { ...search, folder: row.id };
          }

          if (row.type === DocboxItemType.File) {
            return { ...search, file: row.id };
          }

          return { ...search };
        }}
        variant="contained"
        size="small"
        style={{ marginLeft: 16 }}
      >
        View
      </Button>
    ),
  },
];

export default function DocumentBoxBrowser({ folder }: Props) {
  const items: DocboxItem[] = useMemo(() => {
    return [
      ...folder.folders.map(
        (folder) =>
          ({
            type: DocboxItemType.Folder,
            ...folder,
          }) satisfies DocboxItem
      ),
      ...folder.files.map(
        (file) => ({ type: DocboxItemType.File, ...file }) satisfies DocboxItem
      ),
      ...folder.links.map(
        (link) => ({ type: DocboxItemType.Link, ...link }) satisfies DocboxItem
      ),
    ];
  }, [folder]);

  return (
    <Box sx={{ height: 1, width: "100%" }}>
      <DataGrid
        rows={items ?? []}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 100,
            },
          },
        }}
        pageSizeOptions={[100]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
}
