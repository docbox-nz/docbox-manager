import { fData } from "@/utils/format-number";
import { DocboxItemType, type DocboxItem } from "@docbox-nz/docbox-sdk";
import { FileTypeIcon, getFileTypeFromMime } from "@docbox-nz/docbox-ui";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import RouterLink from "../RouterLink";
import MdiInternet from "~icons/mdi/internet";
import MdiFolder from "~icons/mdi/folder";
import Link from "@mui/material/Link";
import type { LinkProps } from "@tanstack/react-router";
import type { GridInitialStateCommunity } from "node_modules/@mui/x-data-grid/esm/models/gridStateCommunity";

type Props = {
  items: DocboxItem[];
};

const columns: GridColDef<DocboxItem>[] = [
  {
    field: "id",
    maxWidth: 200,
    headerName: "ID",
  },
  {
    field: "type",
    width: 60,
    headerName: "Type",
  },
  {
    field: "name",
    flex: 1,
    minWidth: 300,
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
            <>
              <FileTypeIcon
                fileType={getFileTypeFromMime(row.mime)}
                width={32}
                height={32}
                flexShrink={0}
              />

              <Stack>
                <Link
                  component={RouterLink}
                  underline="hover"
                  to="."
                  search={(search) => ({ ...search, preview: row.id })}
                  color="inherit"
                  variant="subtitle2"
                >
                  {row.name}
                </Link>

                <Typography variant="caption" color="text.secondary">
                  {row.mime}
                </Typography>
              </Stack>
            </>
          )}

          {row.type === DocboxItemType.Link && (
            <>
              <Box
                component={MdiInternet}
                width={32}
                height={32}
                flexShrink={0}
              />
              <Stack>
                <Link
                  underline="hover"
                  href={row.value}
                  target="_blank"
                  color="inherit"
                  variant="subtitle2"
                >
                  {row.name}
                </Link>
                <Link
                  underline="hover"
                  href={row.value}
                  target="_blank"
                  variant="caption"
                  color="text.secondary"
                >
                  {row.value}
                </Link>
              </Stack>
            </>
          )}

          {row.type === DocboxItemType.Folder && (
            <>
              <Box
                component={MdiFolder}
                width={32}
                height={32}
                flexShrink={0}
              />
              <Stack>
                <Link
                  component={RouterLink}
                  underline="hover"
                  to="."
                  search={(search) => ({ ...search, folder: row.id })}
                  color="inherit"
                  variant="subtitle2"
                >
                  {row.name}
                </Link>
              </Stack>
            </>
          )}
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
    type: "actions",
    headerName: "Actions",
    getActions: ({ row }: GridRowParams) => [
      ...(row.type !== DocboxItemType.Link
        ? [
            <GridActionsCellItem
              showInMenu
              component={RouterLink}
              {...({
                // GridActionsCellItem doesn't forward props so this has to be done
                // to prevent type errors
                to: ".",
                search: (search) => {
                  if (row.type === DocboxItemType.Folder) {
                    return { ...search, folder: row.id };
                  }

                  if (row.type === DocboxItemType.File) {
                    return { ...search, preview: row.id };
                  }

                  return { ...search };
                },
              } satisfies LinkProps)}
              label="View"
            />,
          ]
        : []),
      <GridActionsCellItem
        showInMenu
        component={RouterLink}
        {...({
          // GridActionsCellItem doesn't forward props so this has to be done
          // to prevent type errors
          to: ".",
          search: (search) => ({ ...search, edit: row.id }),
        } satisfies LinkProps)}
        label="Edit"
      />,
      <GridActionsCellItem
        showInMenu
        component={RouterLink}
        {...({
          // GridActionsCellItem doesn't forward props so this has to be done
          // to prevent type errors
          to: ".",
          search: (search) => ({ ...search, delete: row.id }),
        } satisfies LinkProps)}
        label="Delete"
      />,
    ],
  },
];

const INITIAL_STATE: GridInitialStateCommunity = {
  pagination: {
    paginationModel: {
      pageSize: 25,
    },
  },
  sorting: {
    sortModel: [{ field: "created_at", sort: "desc" }],
  },
};

export default function DocboxItemsTable({ items }: Props) {
  return (
    <Box sx={{ height: 1, width: "100%" }}>
      <DataGrid
        rows={items ?? []}
        columns={columns}
        initialState={INITIAL_STATE}
        pageSizeOptions={[25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
}
