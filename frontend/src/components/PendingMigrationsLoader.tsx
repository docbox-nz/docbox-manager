import { getAPIErrorMessage } from "@/api/axios";
import { useMigrations } from "@/api/root/root.queries";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { Stack } from "@mui/system";
import { PendingMigrations } from "./PendingMigrations";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

export default function PendingMigrationsLoader() {
  const { data, isLoading, error } = useMigrations();

  if (isLoading) {
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
              <Typography variant="h6">Pending Migrations</Typography>
            </Stack>

            <LinearProgress />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ m: 3 }}>
        <CardContent>
          <Stack spacing={1}>
            <Alert color="error">
              Failed to load pending migrations: {getAPIErrorMessage(error)}
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return <PendingMigrations tenants={data} />;
}
