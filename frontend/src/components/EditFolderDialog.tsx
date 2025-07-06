import { getAPIErrorMessage } from "@/api/axios";
import { useUpdateFolder } from "@/api/docbox/docbox.mutations";
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
import type { DocFolder, DocumentBoxScope } from "@docbox-nz/docbox-sdk";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: VoidFunction;

  folder: DocFolder;
  scope: DocumentBoxScope;
};

export default function EditFolderDialog({
  open,
  onClose,
  folder,
  scope,
}: Props) {
  const updateFolder = useUpdateFolder();

  const form = useForm({
    defaultValues: {
      name: folder.name,
    },
    validators: {
      onChange: z.object({
        name: z.string().min(1).max(255),
      }),
    },
    onSubmit: async ({ value }) => {
      await updateFolder.mutateAsync({
        folder_id: folder.id,
        data: { name: value.name },
        scope,
      });

      onCloseReset();
      toast.success("Updated folder");
    },
  });

  const onCloseReset = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onClose={onCloseReset} fullWidth maxWidth="xs">
      <DialogTitle>Edit Folder</DialogTitle>
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

            {updateFolder.isError && (
              <Alert color="error">
                Failed to save: {getAPIErrorMessage(updateFolder.error)}
              </Alert>
            )}

            <DialogActions>
              <Button type="button" variant="outlined" onClick={onCloseReset}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                loading={updateFolder.isPending}
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
