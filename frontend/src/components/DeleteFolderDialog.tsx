import { getAPIErrorMessage } from "@/api/axios";
import { useDeleteFolder } from "@/api/docbox/docbox.mutations";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useForm } from "@tanstack/react-form";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import DialogActions from "@mui/material/DialogActions";
import type { DocFolder, DocumentBoxScope } from "@docbox-nz/docbox-sdk";
import { toast } from "sonner";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  onClose: VoidFunction;

  folder: DocFolder;
  scope: DocumentBoxScope;
};

export default function DeleteFolderDialog({
  open,
  onClose,
  folder,
  scope,
}: Props) {
  const deleteFolder = useDeleteFolder();

  const form = useForm({
    onSubmit: async ({}) => {
      await deleteFolder.mutateAsync({
        folder_id: folder.id,
        scope,
      });

      onClose();
      toast.success("Deleted folder");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete Folder</DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Typography>
              Are you sure you want to delete the{" "}
              <b>&quot;{folder.name}&quot;</b> folder? This will delete any
              files and folders within
            </Typography>

            {deleteFolder.isError && (
              <Alert color="error">
                Failed to delete: {getAPIErrorMessage(deleteFolder.error)}
              </Alert>
            )}

            <DialogActions>
              <Button type="button" variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                loading={deleteFolder.isPending}
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
