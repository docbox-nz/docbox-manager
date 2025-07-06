import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useForm, useStore } from "@tanstack/react-form";
import * as z from "zod/v4";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { v4 as uuidv4 } from "uuid";
import { FormTextField } from "@/components/form/FormTextField";
import Typography from "@mui/material/Typography";
import { FormAutocomplete } from "@/components/form/FormAutocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import { useCallback } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import MdiArrowDownDrop from "~icons/mdi/arrow-down-drop";
import MdiError from "~icons/mdi/error";
import MdiCheckCircle from "~icons/mdi/check-circle";
import { useCreateTenant } from "@/api/tenant/tenant.mutations";
import { getAPIErrorMessage } from "@/api/axios";
import { toast } from "sonner";
import MdiChevronLeft from "~icons/mdi/chevron-left";
import IconButton from "@mui/material/IconButton";
import RouterLink from "@/components/RouterLink";

export const Route = createFileRoute("/tenant/create")({
  component: TenantCreate,
});

const DEFAULT_NAME = "Test";
const DEFAULT_TAG = "test";
const ENV_TAG: Partial<Record<string, string>> = {
  Development: "dev",
  Production: "prod",
};

const tagValidation = z
  .string()
  .nonempty("Tag must not be empty")
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message:
      "Only alphanumeric characters, underscores, and dashes are allowed",
  });

function TenantCreate() {
  const createTenantMutation = useCreateTenant();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      id: uuidv4(),
      name: DEFAULT_NAME,
      env: "Production",
      database: {
        db_name: DEFAULT_TAG,
        db_secret_name: DEFAULT_TAG,
        db_role_name: DEFAULT_TAG,
      },
      storage: {
        storage_bucket_name: DEFAULT_TAG,
        s3_queue_arn: "",
        storage_cors_origins: [""],
      },
      search: {
        search_index_name: DEFAULT_TAG,
      },

      event_queue_url: "",
      simplified: true,
      tag: DEFAULT_TAG,
    },
    validators: {
      onChange: z
        .object({
          id: z.uuidv4(),
          name: z.string().nonempty(),
          env: z.string().nonempty(),
          database: z.object({
            db_name: z.string().nonempty(),
            db_secret_name: z.string().nonempty(),
            db_role_name: z.string().nonempty(),
          }),
          storage: z.object({
            storage_bucket_name: z.string().nonempty(),
            s3_queue_arn: z.string(),
            storage_cors_origins: z.array(z.string()),
          }),
          search: z.object({
            search_index_name: z.string().nonempty(),
          }),
          event_queue_url: z.string(),

          simplified: z.boolean(),
          tag: z.any(),
        })
        .check((ctx) => {
          // When simplified mode is enabled the tag must be validated
          if (ctx.value.simplified) {
            const result = tagValidation.safeParse(ctx.value.tag);
            if (!result.success) {
              // Add all error messages from tagValidation
              for (const issue of result.error.issues) {
                ctx.issues.push({
                  ...issue,
                  path: ["tag"],
                });
              }
            }
          }
        }),
    },
    onSubmit: async ({ value }) => {
      const envTag = ENV_TAG[value.env] ?? value.env.toLowerCase();

      const db_name = `docbox-${value.database.db_name}-${envTag}`;
      const db_secret_name = `postgres/docbox/${envTag}/${value.database.db_secret_name}`;
      const db_role_name = `docbox_${value.database.db_role_name}_${envTag}_api`;
      const storage_bucket_name = `docbox-${value.storage.storage_bucket_name}-${envTag}`;
      const search_index_name = `docbox-${value.search.search_index_name}-${envTag}`;
      const event_queue_url =
        value.event_queue_url.trim().length > 0 ? value.event_queue_url : null;
      const storage_s3_queue_arn =
        value.storage.s3_queue_arn.trim().length > 0
          ? value.storage.s3_queue_arn
          : null;

      const storage_cors_origins = value.storage.storage_cors_origins.filter(
        (value) => value.trim().length > 0
      );

      await createTenantMutation.mutateAsync({
        id: value.id,
        name: value.name,
        env: value.env,
        db_name,
        db_secret_name,
        db_role_name,
        storage_bucket_name,
        storage_s3_queue_arn,
        storage_cors_origins,
        search_index_name,
        event_queue_url,
      });
      toast.success("Created tenant");

      navigate({ to: "/" });
    },
  });

  const simplified = useStore(form.store, (state) => state.values.simplified);
  const environment = useStore(form.store, (state) => state.values.env);
  const environmentTag = ENV_TAG[environment] ?? "unknown";

  const onChangeTag = useCallback(() => {
    const simplified = form.getFieldValue("simplified");
    if (!simplified) return;

    // Update all linked fields that are determined by the tag
    const tag = form.getFieldValue("tag");
    form.setFieldValue("database.db_name", tag);
    form.setFieldValue("database.db_secret_name", tag);
    form.setFieldValue("database.db_role_name", tag.replace("-", "_"));
    form.setFieldValue("storage.storage_bucket_name", tag);
    form.setFieldValue("search.search_index_name", tag);
  }, [form]);

  const renderTenant = (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <form.Field
            name="id"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="ID"
                required
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
                required
              />
            )}
          />

          <form.Field
            name="env"
            children={(field) => (
              <FormAutocomplete
                field={field}
                options={["Development", "Production"]}
                inputProps={{
                  variant: "outlined",
                  size: "medium",
                  label: "Environment",
                  required: true,
                }}
              />
            )}
          />

          <Stack spacing={1}>
            <form.Field
              name="simplified"
              children={(field) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.state.value}
                      onChange={(_event, checked) =>
                        field.handleChange(checked)
                      }
                    />
                  }
                  label="Simplified setup using tags"
                />
              )}
              listeners={{
                onChange: onChangeTag,
              }}
            />

            <Alert color="info">
              The simplified setup automatically chooses most of the credentials
              below using a predefined pattern based on a "tag" you provide
            </Alert>
          </Stack>

          {simplified && (
            <form.Field
              name="tag"
              children={(field) => (
                <FormTextField
                  field={field}
                  variant="outlined"
                  size="medium"
                  label="Tag"
                  helperText="Tag must be unique within the environment"
                  required
                />
              )}
              listeners={{
                onChange: onChangeTag,
              }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const validationIndicator = (isValid: boolean) => {
    return (
      <Box
        component="span"
        sx={{ color: isValid ? "success.main" : "error.main", mr: 1 }}
      >
        {isValid ? (
          <MdiCheckCircle
            width={22}
            height={22}
            style={{ verticalAlign: "middle" }}
          />
        ) : (
          <MdiError
            width={22}
            height={20}
            style={{ verticalAlign: "middle" }}
          />
        )}
      </Box>
    );
  };

  const renderDatabase = (
    <Accordion elevation={2}>
      <AccordionSummary
        expandIcon={<MdiArrowDownDrop width={28} height={28} />}
      >
        <Typography variant="h6">
          <form.Subscribe
            selector={(state) => {
              return (
                state.fieldMeta["database.db_name"] &&
                state.fieldMeta["database.db_name"].isValid &&
                state.fieldMeta["database.db_role_name"] &&
                state.fieldMeta["database.db_role_name"].isValid &&
                state.fieldMeta["database.db_secret_name"] &&
                state.fieldMeta["database.db_secret_name"].isValid
              );
            }}
            children={(isValid) => validationIndicator(isValid)}
          />
          Database
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          <form.Field
            name="database.db_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Database Name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">docbox-</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        -{environmentTag}
                      </InputAdornment>
                    ),
                  },
                }}
                helperText="Name of the postgres database"
              />
            )}
          />

          <form.Field
            name="database.db_role_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Database Role Name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">docbox_</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        _{environmentTag}_api
                      </InputAdornment>
                    ),
                  },
                }}
                helperText="Name of the role used to access"
              />
            )}
          />

          <form.Field
            name="database.db_secret_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Database Secret Name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        postgres/docbox/{environmentTag}/
                      </InputAdornment>
                    ),
                  },
                }}
                helperText="Name of the secret to store the database credentials within"
              />
            )}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderStorage = (
    <Accordion elevation={2}>
      <AccordionSummary
        expandIcon={<MdiArrowDownDrop width={28} height={28} />}
      >
        <Typography variant="h6">
          <form.Subscribe
            selector={(state) => {
              return (
                state.fieldMeta["storage.storage_bucket_name"] &&
                state.fieldMeta["storage.storage_bucket_name"].isValid &&
                state.fieldMeta["storage.s3_queue_arn"] &&
                state.fieldMeta["storage.s3_queue_arn"].isValid &&
                state.fieldMeta["storage.storage_cors_origins"] &&
                state.fieldMeta["storage.storage_cors_origins"].isValid
              );
            }}
            children={(isValid) => validationIndicator(isValid)}
          />
          Storage
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          <form.Field
            name="storage.storage_bucket_name"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="S3 Bucket Name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">docbox-</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        -{environmentTag}
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />

          <form.Field
            name="storage.s3_queue_arn"
            children={(field) => (
              <FormTextField
                field={field}
                variant="outlined"
                size="medium"
                label="Notification Queue ARN"
                helperText="ARN for the notification queue for presigned upload file creation events. Required for presigned uploads to work"
              />
            )}
          />
        </Stack>

        <Stack spacing={2} sx={{ mt: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontSize: 16 }}>
              CORS Origins
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Specify allowed origins for CORS access to the S3 bucket, this is
              required for presigned uploads from web applications
            </Typography>
          </Stack>

          <form.Field name="storage.storage_cors_origins" mode="array">
            {(field) => {
              return (
                <Stack spacing={3}>
                  {field.state.value.map((_, i) => {
                    return (
                      <form.Field
                        key={i}
                        name={`storage.storage_cors_origins[${i}]`}
                      >
                        {(subField) => {
                          return (
                            <Stack direction="row" spacing={2}>
                              <FormTextField
                                field={subField}
                                variant="outlined"
                                size="medium"
                                label={`Origin ${i + 1}`}
                                placeholder="https://example.com"
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
          </form.Field>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderSearch = (
    <Accordion elevation={2}>
      <AccordionSummary
        expandIcon={<MdiArrowDownDrop width={28} height={28} />}
      >
        <Typography variant="h6">
          <form.Subscribe
            selector={(state) => {
              return (
                state.fieldMeta["search.search_index_name"] &&
                state.fieldMeta["search.search_index_name"].isValid
              );
            }}
            children={(isValid) => validationIndicator(isValid)}
          />
          Search
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <form.Field
          name="search.search_index_name"
          children={(field) => (
            <FormTextField
              field={field}
              variant="outlined"
              size="medium"
              label="Search Index Name"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">docbox-</InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      -{environmentTag}
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />
      </AccordionDetails>
    </Accordion>
  );

  const renderEvents = (
    <Accordion elevation={2}>
      <AccordionSummary
        expandIcon={<MdiArrowDownDrop width={28} height={28} />}
      >
        <Typography variant="h6">
          <form.Subscribe
            selector={(state) => {
              return (
                state.fieldMeta["event_queue_url"] &&
                state.fieldMeta["event_queue_url"].isValid
              );
            }}
            children={(isValid) => validationIndicator(isValid)}
          />
          Event Notifications
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <form.Field
          name="event_queue_url"
          children={(field) => (
            <FormTextField
              field={field}
              variant="outlined"
              size="medium"
              label="Event Queue URL"
              helperText="Optional: SQS Queue URL to send notifications to when certain events occur such as file uploads"
            />
          )}
        />
      </AccordionDetails>
    </Accordion>
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
          title={
            <Stack direction="row" alignItems="center">
              <IconButton
                size="small"
                sx={{ mr: 0.5 }}
                component={RouterLink}
                to="/"
              >
                <MdiChevronLeft width={32} height={32} />
              </IconButton>

              <Typography variant="inherit">Create Tenant</Typography>
            </Stack>
          }
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

              <Stack>
                {renderDatabase}
                {renderStorage}
                {renderSearch}
                {renderEvents}
              </Stack>

              {createTenantMutation.isError && (
                <Alert color="error">
                  Failed to create:{" "}
                  {getAPIErrorMessage(createTenantMutation.error)}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                loading={createTenantMutation.isPending}
              >
                Create
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
