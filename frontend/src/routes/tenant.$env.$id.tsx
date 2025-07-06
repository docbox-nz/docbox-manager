import { useTenant } from "@/api/tenant/tenant.queries";
import DocboxProvider from "@/components/DocboxProvider";
import LoadingPage from "@/components/LoadingPage";
import ErrorPage from "@/components/ErrorPage";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { getAPIErrorMessage } from "@/api/axios";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { z } from "zod";
import TenantFileBrowser from "@/components/TenantFileBrowser";

const docboxSchema = z.object({
  scope: z.string().optional(),
  folder: z.string().optional(),

  preview: z.string().optional(),
  edit: z.string().optional(),
  delete: z.string().optional(),
});

export const Route = createFileRoute("/tenant/$env/$id")({
  component: RouteComponent,
  validateSearch: docboxSchema,
});

function RouteComponent() {
  const { env, id } = Route.useParams();
  const { scope, folder, preview, edit, delete: deleteId } = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: tenant,
    isLoading: tenantLoading,
    error: tenantError,
  } = useTenant(env, id);

  const onClosePreview = () =>
    navigate({
      to: ".",
      search: (search) => ({ ...search, preview: undefined }),
    });

  const onCloseEdit = () =>
    navigate({
      to: ".",
      search: (search) => ({ ...search, edit: undefined }),
    });

  const onCloseDelete = () =>
    navigate({
      to: ".",
      search: (search) => ({ ...search, delete: undefined }),
    });

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

          <TenantFileBrowser
            scope={scope}
            folder_id={folder}
            preview_id={preview}
            edit_id={edit}
            delete_id={deleteId}
            onClosePreview={onClosePreview}
            onCloseEdit={onCloseEdit}
            onCloseDelete={onCloseDelete}
          />
        </CardContent>
      </Card>
    </DocboxProvider>
  );
}
