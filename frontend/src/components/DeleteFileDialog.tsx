import { getAPIErrorMessage } from "@/api/axios";
import { useDeleteFile } from "@/api/docbox/docbox.mutations";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useForm } from "@tanstack/react-form";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import DialogActions from "@mui/material/DialogActions";
import type { DocFile, DocumentBoxScope } from "@docbox-nz/docbox-sdk";
import { toast } from "sonner";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  onClose: VoidFunction;

  file: DocFile;
  scope: DocumentBoxScope;
};

export default function DeleteFileDialog({
  open,
  onClose,
  file,
  scope,
}: Props) {
  const deleteLink = useDeleteFile();

  const form = useForm({
    onSubmit: async ({}) => {
      await deleteLink.mutateAsync({
        file_id: file.id,
        scope,
      });

      onClose();
      toast.success("Deleted file");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete File</DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Typography>
              Are you sure you want to delete the <b>&quot;{file.name}&quot;</b>{" "}
              file?
            </Typography>

            {deleteLink.isError && (
              <Alert color="error">
                Failed to delete: {getAPIErrorMessage(deleteLink.error)}
              </Alert>
            )}

            <DialogActions>
              <Button type="button" variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                loading={deleteLink.isPending}
              >
                Delete
              </Button>
            </DialogActions>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
