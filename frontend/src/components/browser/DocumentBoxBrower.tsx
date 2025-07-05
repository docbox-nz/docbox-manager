import {
  DocboxItemType,
  type DocboxItem,
  type ResolvedFolder,
} from "@docbox-nz/docbox-sdk";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

type Props = {
  folder: ResolvedFolder;
};

const columns: GridColDef<DocboxItem>[] = [
  {
    field: "id",
    width: 300,
    headerName: "ID",
  },
  {
    field: "name",
    flex: 1,
    headerName: "Name",
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
    <Box sx={{ mt: 3, height: 1, width: "100%" }}>
      <DataGrid
        rows={items ?? []}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
}
