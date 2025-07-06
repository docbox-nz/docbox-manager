import { useDocumentBoxes } from "@/api/docbox/docbox.queries";
import Button from "@mui/material/Button";
import { useMemo, useState } from "react";
import type { DocumentBox } from "@docbox-nz/docbox-sdk";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { getAPIErrorMessage } from "@/api/axios";
import Box from "@mui/material/Box";
import { useParams, useSearch } from "@tanstack/react-router";
import RouterLink from "./RouterLink";

const columns: GridColDef<DocumentBox>[] = [
  {
    field: "scope",
    flex: 1,
    headerName: "Scope",
  },
  {
    field: "created_at",
    headerName: "Created At",
  },

  {
    field: "actions",
    headerName: "Actions",
    renderCell: ({ row }) => (
      <Button
        component={RouterLink}
        to="."
        search={(search) => ({ ...search, scope: row.scope })}
        variant="contained"
        size="small"
        style={{ marginLeft: 16 }}
      >
        View
      </Button>
    ),
  },
];

const getRowId = (box: DocumentBox) => box.scope;

export default function DocumentBoxesTable() {
  const query = useMemo(() => ({ offset: 0, limit: 100 }), []);

  const {
    data: documentBoxes,
    isLoading: documentBoxesLoading,
    error: documentBoxesError,
  } = useDocumentBoxes(query);

  return (
    <Stack spacing={1}>
      {documentBoxesError && (
        <Alert color="error">
          Failed to load tenants: {getAPIErrorMessage(documentBoxesError)}
        </Alert>
      )}

      <Box sx={{ mt: 3, height: 1, width: "100%" }}>
        <DataGrid
          getRowId={getRowId}
          loading={documentBoxesLoading}
          rows={documentBoxes?.results ?? []}
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
    </Stack>
  );
}
