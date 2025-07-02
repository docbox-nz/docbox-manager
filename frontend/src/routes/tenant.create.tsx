import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import { createFileRoute } from "@tanstack/react-router";
import { v4 as uuidv4 } from "uuid";
import { FormTextField } from "@/components/form/FormTextField";
import Typography from "@mui/material/Typography";
import { FormAutocomplete } from "@/components/form/FormAutocomplete";

export const Route = createFileRoute("/tenant/create")({
  component: TenantCreate,
});

function TenantCreate() {
  const form = useForm({
    defaultValues: {
      id: uuidv4(),
      name: "",
      env: "",
      db_name: "",
      db_secret_name: "",
      db_role_name: "",
      db_role_password: "",
      s3_name: "",
      s3_queue_arn: "",
      origins: [""],
      os_index_name: "",
      event_queue_url: "",
    },
    validators: {
      onSubmit: z.object({
        id: z.string().nonempty(),
        name: z.string().nonempty(),
        env: z.string().nonempty(),
        db_name: z.string().nonempty(),
        db_secret_name: z.string().nonempty(),
        db_role_name: z.string().nonempty(),
        db_role_password: z.string().nonempty(),
        s3_name: z.string().nonempty(),
        os_index_name: z.string().nonempty(),
        event_queue_url: z.string().nonempty(),
        origins: z.array(z.string()),
        s3_queue_arn: z.string(),
      }),
    },
    onSubmit: async ({ value }) => {},
  });

  const renderTenant = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tenant
        </Typography>
        <Stack spacing={3}>
          <form.Field
            name="id"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="ID"
              />
            )}
          />

          <form.Field
            name="name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Name"
              />
            )}
          />

          <form.Field
            name="env"
            children={(field) => (
              <FormAutocomplete
                freeSolo={true}
                field={field}
                options={["Development", "Production", "Staging", "Test"]}
                inputProps={{
                  variant: "outlined",
                  size: "medium",
                  label: "Environment",
                }}
              />
            )}
          />
        </Stack>
      </CardContent>
    </Card>
  );

  const renderDatabase = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Database
        </Typography>
        <Stack spacing={3}>
          <form.Field
            name="db_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Database Name"
              />
            )}
          />

          <form.Field
            name="db_secret_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Database Secret Name"
              />
            )}
          />

          <form.Field
            name="db_role_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Database Role Name"
              />
            )}
          />

          <form.Field
            name="db_role_password"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Database Role Password"
                type="password"
              />
            )}
          />
        </Stack>
      </CardContent>
    </Card>
  );

  const renderStorage = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Storage
        </Typography>
        <Stack spacing={3}>
          <form.Field
            name="s3_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="S3 Bucket Name"
              />
            )}
          />

          <form.Field
            name="s3_queue_arn"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Notification Queue ARN"
              />
            )}
          />
        </Stack>

        <Stack spacing={1} sx={{ mt: 3 }}>
          <Typography variant="body2">CORS Origins</Typography>
          <form.Field name="origins" mode="array">
            {(field) => {
              return (
                <Stack spacing={3}>
                  {field.state.value.map((_, i) => {
                    return (
                      <form.Field key={i} name={`origins[${i}]`}>
                        {(subField) => {
                          return (
                            <Stack direction="row" spacing={2}>
                              <FormTextField
                                field={subField}
                                variant="outlined"
                                size="medium"
                                label={`Origin ${i + 1}`}
                              />

                              <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => field.removeValue(i)}
                              >
                                Remove
                              </Button>
                            </Stack>
                          );
                        }}
                      </form.Field>
                    );
                  })}
                  <Button
                    variant="contained"
                    onClick={() =>
                      field.pushValue("", { dontUpdateMeta: true })
                    }
                    type="button"
                  >
                    Add Origin
                  </Button>
                </Stack>
              );
            }}
          </form.Field>{" "}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderSearch = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Search
        </Typography>

        <form.Field
          name="os_index_name"
          children={(field) => (
            <FormTextField
              field={field}
              variant="outlined"
              size="medium"
              label="Search Index Name"
            />
          )}
        />
      </CardContent>
    </Card>
  );

  const renderEvents = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Event Notifications
        </Typography>

        <form.Field
          name="event_queue_url"
          children={(field) => (
            <FormTextField
              field={field}
              variant="outlined"
              size="medium"
              label="Event Queue URL"
            />
          )}
        />
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card sx={{ maxWidth: 800, width: 1, my: 3 }}>
        <CardHeader
          title="Create Tenant"
          subheader="Configure the new tenant below"
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
              {renderTenant}
              {renderDatabase}
              {renderStorage}
              {renderSearch}
              {renderEvents}

              <Button type="submit" variant="contained">
                Create
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
