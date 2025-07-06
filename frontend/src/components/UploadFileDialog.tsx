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
import Box from "@mui/material/Box";
import FormUploadFile from "./form/FormUploadFile";
import { useCallback } from "react";
import type { DocumentBoxScope } from "@docbox-nz/docbox-sdk";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: VoidFunction;

  folder_id: string;
  scope: DocumentBoxScope;
};

export default function UploadFileDialog({
  open,
  onClose,
  folder_id,
  scope,
}: Props) {
  const uploadFileMutation = useUploadFile();

  const form = useForm({
    defaultValues: {
      files: [] as File[],
    },
    validators: {
      onChange: z.object({
        files: z.array(z.file()),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      await Promise.all(
        value.files.map(async (file) => {
          await uploadFileMutation.mutateAsync({
            file,
            folder_id,
            scope,
            options: {
              onProgress(name, progress) {
                formApi.setFieldValue("files", (files) => {
                  return files.map((otherFile) => {
                    if (otherFile === file) {
                      return Object.assign(file, {
                        progress: {
                          name,
                          progress,
                        },
                      });
                    }

                    return otherFile;
                  });
                });
              },
            },
          });
        })
      );

      onCloseReset();
      toast.success("Upload complete");
    },
  });

  const onCloseReset = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onClose={onCloseReset}>
      <DialogTitle>Upload File</DialogTitle>
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

            <form.Field
              name="files"
              children={(field) => <FormUploadFile field={field} />}
            />

            <DialogActions>
              <Button type="button" variant="outlined" onClick={onCloseReset}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                loading={uploadFileMutation.isPending}
              >
                Upload
              </Button>
            </DialogActions>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
