import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Alert from "@mui/material/Alert";
import { getAPIErrorMessage } from "@/api/axios";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useInitialize } from "@/api/root/root.mutations";
import CircularProgress from "@mui/material/CircularProgress";

export default function InitializePage() {
  const initializeMutation = useInitialize();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Card sx={{ maxWidth: 500, width: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ width: 1, px: 2, py: 3 }}
        >
          <Box component="img" src="/box.svg" width={32} height={32} />
          <Typography variant="h6">Docbox Manager </Typography>
        </Stack>

        <Divider />

        <CardHeader
          title="Initialize"
          subheader="The connected docbox server database has not been initialized, ensure all configuration is correct then press 'Initialize' to setup the database"
          slotProps={{
            subheader: {
              mt: 1,
            },
          }}
        />
        <CardContent sx={{ py: 0 }}>
          <Stack spacing={3}>
            {initializeMutation.isError && (
              <Alert color="error">
                Failed to initialize:{" "}
                {getAPIErrorMessage(initializeMutation.error)}
              </Alert>
            )}

            {initializeMutation.isPending && <CircularProgress />}

            <Button
              variant="contained"
              loading={initializeMutation.isPending}
              onClick={() => initializeMutation.mutate()}
            >
              Initialize
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
