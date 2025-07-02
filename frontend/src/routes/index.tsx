import { useTenants } from "@/api/tenant/tenant.queries";
import type { Tenant } from "@/api/tenant/tenant.types";
import Container from "@mui/material/Container";
import { createFileRoute } from "@tanstack/react-router";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";

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
    <Container>
      <Box sx={{ height: 400, width: "100%" }}>
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
    </Container>
  );
}
