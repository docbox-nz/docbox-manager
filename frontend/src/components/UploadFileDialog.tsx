import { getAPIErrorMessage } from "@/api/axios";
import {
  useCreateDocumentBox,
  useUploadFile,
} from "@/api/docbox/docbox.mutations";
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

type Props = {
  open: boolean;
  onClose: VoidFunction;
};

export default function UploadFileDialog({ open, onClose }: Props) {
  const uploadFileMutation = useUploadFile();

  const form = useForm({
    defaultValues: {},
    validators: {
      onChange: z.object({}),
    },
    onSubmit: async ({ value }) => {
      // await uploadFileMutation.mutateAsync({ scope: value.scope });
    },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Document box</DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Stack spacing={3} sx={{ pt: 2 }}>
            {uploadFileMutation.isError && (
              <Alert color="error">
                Failed to upload: {getAPIErrorMessage(uploadFileMutation.error)}
              </Alert>
            )}

            <DialogActions>
              <Button
                type="submit"
                variant="contained"
                loading={uploadFileMutation.isPending}
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
