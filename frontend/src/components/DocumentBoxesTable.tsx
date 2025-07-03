import { useDocumentBoxes } from "@/api/docbox/docbox.queries";
import Button from "@mui/material/Button";
import { useMemo } from "react";
import RouterLink from "./RouterLink";
import type { DocumentBox } from "@docbox-nz/docbox-sdk";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { getAPIErrorMessage } from "@/api/axios";
import Box from "@mui/material/Box";

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
      <Button variant="contained" size="small" style={{ marginLeft: 16 }}>
        View
      </Button>
    ),
  },
];

export default function DocumentBoxesTable() {
  const query = useMemo(() => ({ offset: 0, limit: 100 }), []);

  const {
    data: documentBoxes,
    isLoading: documentBoxesLoading,
    error: documentBoxesError,
  } = useDocumentBoxes(query);

  return (
    <Card sx={{ m: 3 }}>
      <CardContent>
        <Stack spacing={1}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 1, py: 1 }}
          >
            <Typography variant="h6">Document Boxes</Typography>
          </Stack>

          {documentBoxesError && (
            <Alert color="error">
              Failed to load tenants: {getAPIErrorMessage(documentBoxesError)}
            </Alert>
          )}

          <Box sx={{ mt: 3, height: 1, width: "100%" }}>
            <DataGrid
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
      </CardContent>
    </Card>
  );
}
