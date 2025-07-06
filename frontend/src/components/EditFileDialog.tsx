import { getAPIErrorMessage } from "@/api/axios";
import { useUpdateFile } from "@/api/docbox/docbox.mutations";
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
import type { DocFile, DocumentBoxScope } from "@docbox-nz/docbox-sdk";
import { toast } from "sonner";
import { getFileExtension } from "@docbox-nz/docbox-ui";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  onClose: VoidFunction;

  file: DocFile;
  scope: DocumentBoxScope;
};

export default function EditFileDialog({ open, onClose, file, scope }: Props) {
  const updateFile = useUpdateFile();

  const extension = getFileExtension(file.name);
  const nameWithoutExtension = extension
    ? file.name.substring(0, file.name.length - (extension.length + 1))
    : file.name;

  const form = useForm({
    defaultValues: {
      name: nameWithoutExtension,
    },
    validators: {
      onChange: z.object({
        name: z.string().min(1).max(255),
      }),
    },
    onSubmit: async ({ value }) => {
      await updateFile.mutateAsync({
        file_id: file.id,
        data: { name: `${value.name}.${extension}` },
        scope,
      });

      onCloseReset();
      toast.success("Updated file");
    },
  });

  const onCloseReset = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onClose={onCloseReset} fullWidth maxWidth="xs">
      <DialogTitle>Edit File</DialogTitle>
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
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography color="text.secondary">
                            .{extension}
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />

            {updateFile.isError && (
              <Alert color="error">
                Failed to save: {getAPIErrorMessage(updateFile.error)}
              </Alert>
            )}

            <DialogActions>
              <Button type="button" variant="outlined" onClick={onCloseReset}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                loading={updateFile.isPending}
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
