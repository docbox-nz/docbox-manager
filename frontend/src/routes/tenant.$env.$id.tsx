import { useTenant } from "@/api/tenant/tenant.queries";
import DocboxProvider from "@/components/DocboxProvider";
import DocumentBoxesTable from "@/components/DocumentBoxesTable";
import LoadingPage from "@/components/LoadingPage";
import ErrorPage from "@/components/ErrorPage";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { getAPIErrorMessage } from "@/api/axios";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CreateDocumentBoxDialog from "@/components/CreateDocumentBoxDialog";
import { useState } from "react";

export const Route = createFileRoute("/tenant/$env/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { env, id } = Route.useParams();
  const {
    data: tenant,
    isLoading: tenantLoading,
    error: tenantError,
  } = useTenant(env, id);

  const [createOpen, setCreateOpen] = useState(false);

  if (tenantLoading) {
    return <LoadingPage />;
  }

  if (tenantError || !tenant) {
    return (
      <ErrorPage
        error={`Failed to load tenant: ${getAPIErrorMessage(tenantError)}`}
      />
    );
  }

  return (
    <DocboxProvider tenantId={id} env={env}>
      <Card sx={{ m: 3 }}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h4">
              {tenant.name} <Chip label={tenant.env} sx={{ ml: 1 }} />
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {tenant.id}
            </Typography>
          </Stack>

          <Divider sx={{ mt: 2 }} />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 1, py: 2 }}
          >
            <Typography variant="h6">Document Boxes</Typography>
            <Button onClick={() => setCreateOpen(true)}>Create Box</Button>

            <CreateDocumentBoxDialog
              open={createOpen}
              onClose={() => setCreateOpen(false)}
            />
          </Stack>

          <DocumentBoxesTable />
        </CardContent>
      </Card>
    </DocboxProvider>
  );
}
