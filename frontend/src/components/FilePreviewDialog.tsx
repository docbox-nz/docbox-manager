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

export default function FilePreviewDialog({
  open,
  onClose,
  file,
  scope,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle></DialogTitle>
      <DialogContent></DialogContent>
    </Dialog>
  );
}
