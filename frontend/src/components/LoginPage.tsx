import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import { useAuthenticate } from "@/api/auth/auth.mutations";
import Alert from "@mui/material/Alert";
import { getAPIErrorMessage } from "@/api/axios";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { FormTextField } from "./form/FormTextField";

export default function LoginPage() {
  const authenticateMutation = useAuthenticate();

  const form = useForm({
    defaultValues: {
      password: "",
    },
    validators: {
      onChange: z.object({
        password: z.string().nonempty(),
      }),
    },
    onSubmit: async ({ value }) => {
      await authenticateMutation.mutateAsync({ password: value.password });
    },
  });

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
          title="Login"
          subheader="You must login to access Docbox Manager, enter your password below"
          slotProps={{
            subheader: {
              mt: 1,
            },
          }}
        />
        <CardContent sx={{ py: 0 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <Stack spacing={3}>
              <form.Field
                name="password"
                children={(field) => (
                  <FormTextField
                    field={field}
                    variant="outlined"
                    size="medium"
                    label="Password"
                    type="password"
                  />
                )}
              />

              {authenticateMutation.isError && (
                <Alert color="error">
                  Failed to authenticate:{" "}
                  {getAPIErrorMessage(authenticateMutation.error)}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                loading={authenticateMutation.isPending}
              >
                Login
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
