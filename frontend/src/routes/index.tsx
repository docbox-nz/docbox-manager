import { useTenants } from "@/api/tenant/tenant.queries";
import type { Tenant } from "@/api/tenant/tenant.types";
import Container from "@mui/material/Container";
import { createFileRoute } from "@tanstack/react-router";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

export const Route = createFileRoute("/")({
  component: App,
});

const columns: GridColDef<Tenant>[] = [
  {
    field: "name",
    headerName: "Name",
  },
  {
    field: "env",
    headerName: "Environment",
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

          <Box sx={{ mt: 3, height: 1, width: "100%" }}>
            <DataGrid
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
