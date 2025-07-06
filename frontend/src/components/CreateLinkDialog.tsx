import { getAPIErrorMessage } from "@/api/axios";
import { useCreateFolder } from "@/api/docbox/docbox.mutations";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { FormTextField } from "./form/FormTextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import DialogActions from "@mui/material/DialogActions";
import type { DocumentBoxScope, FolderId } from "@docbox-nz/docbox-sdk";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: VoidFunction;

  folder_id: FolderId;
  scope: DocumentBoxScope;
};

export default function CreateLinkDialog({
  open,
  onClose,
  folder_id,
  scope,
}: Props) {
  const createLinkMutation = useCreateFolder();

  const form = useForm({
    defaultValues: {
      name: "",
      value: "",
    },
    validators: {
      onChange: z.object({
        name: z.string().min(1).max(255),
        value: z.url(),
      }),
    },
    onSubmit: async ({ value }) => {
      await createLinkMutation.mutateAsync({
        data: { name: value.name, folder_id: folder_id },
        scope,
      });

      onCloseReset();
      toast.success("Created folder");
    },
  });

  const onCloseReset = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onClose={onCloseReset} fullWidth maxWidth="xs">
      <DialogTitle>Create Link</DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Stack spacing={3} sx={{ pt: 2 }}>
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
              name="value"
              children={(field) => (
                <FormTextField
                  field={field}
                  variant="outlined"
                  size="medium"
                  label="URL"
                />
              )}
            />

            {createLinkMutation.isError && (
              <Alert color="error">
                Failed to create: {getAPIErrorMessage(createLinkMutation.error)}
              </Alert>
            )}

            <DialogActions>
              <Button type="button" variant="outlined" onClick={onCloseReset}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                loading={createLinkMutation.isPending}
              >
                Create
              </Button>
            </DialogActions>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
