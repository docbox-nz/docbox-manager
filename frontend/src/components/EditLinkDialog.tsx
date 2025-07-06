import { getAPIErrorMessage } from "@/api/axios";
import { useUpdateLink } from "@/api/docbox/docbox.mutations";
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
import type { DocLink, DocumentBoxScope } from "@docbox-nz/docbox-sdk";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: VoidFunction;

  link: DocLink;
  scope: DocumentBoxScope;
};

export default function EditLinkDialog({ open, onClose, link, scope }: Props) {
  const updateLink = useUpdateLink();

  const form = useForm({
    defaultValues: {
      name: link.name,
      value: link.value,
    },
    validators: {
      onChange: z.object({
        name: z.string().min(1).max(255),
        value: z.url(),
      }),
    },
    onSubmit: async ({ value }) => {
      await updateLink.mutateAsync({
        link_id: link.id,
        data: { name: value.name, value: value.value },
        scope,
      });

      onCloseReset();
      toast.success("Updated link");
    },
  });

  const onCloseReset = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onClose={onCloseReset} fullWidth maxWidth="xs">
      <DialogTitle>Edit Link</DialogTitle>
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

            {updateLink.isError && (
              <Alert color="error">
                Failed to save: {getAPIErrorMessage(updateLink.error)}
              </Alert>
            )}

            <DialogActions>
              <Button type="button" variant="outlined" onClick={onCloseReset}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                loading={updateLink.isPending}
              >
                Save
              </Button>
            </DialogActions>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
