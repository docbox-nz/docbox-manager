import { useTenants } from "@/api/tenant/tenant.queries";
import type { Tenant } from "@/api/tenant/tenant.types";
import { createFileRoute } from "@tanstack/react-router";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getAPIErrorMessage } from "@/api/axios";
import Alert from "@mui/material/Alert";

export const Route = createFileRoute("/")({
  component: App,
});

const columns: GridColDef<Tenant>[] = [
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
  {
    field: "env",
    headerName: "Environment",
  },
  {
    field: "db_name",
    width: 300,
    headerName: "Database Name",
  },
  {
    field: "s3_name",
    width: 300,
    headerName: "Storage Bucket Name",
  },
];

function App() {
  const {
    data: tenants,
    isLoading: tenantsLoading,
    error: tenantsError,
  } = useTenants();

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
            <Typography variant="h6">Tenants</Typography>
            <Button href="/tenant/create">Create Tenant</Button>
          </Stack>

          {tenantsError && (
            <Alert color="error">
              Failed to load tenants: {getAPIErrorMessage(tenantsError)}
            </Alert>
          )}

          <Box sx={{ mt: 3, height: 1, width: "100%" }}>
            <DataGrid
              loading={tenantsLoading}
              rows={tenants ?? []}
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
