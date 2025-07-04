import { getAPIErrorMessage } from "@/api/axios";
import { useCreateDocumentBox } from "@/api/docbox/docbox.mutations";
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

export default function CreateDocumentBoxDialog({ open, onClose }: Props) {
  const createDocumentBoxMutation = useCreateDocumentBox();

  const form = useForm({
    defaultValues: {
      scope: "",
    },
    validators: {
      onChange: z.object({
        scope: z.string().regex(/^[A-Za-z0-9:\-_.]+$/, {
          message:
            "Only letters (A–Z, a–z), numbers (0–9), and the characters ':', '-', '_', and '.' are allowed.",
        }),
      }),
    },
    onSubmit: async ({ value }) => {
      await createDocumentBoxMutation.mutateAsync({ scope: value.scope });
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
            <form.Field
              name="scope"
              children={(field) => (
                <FormTextField
                  field={field}
                  variant="outlined"
                  size="medium"
                  label="Scope"
                />
              )}
            />

            {createDocumentBoxMutation.isError && (
              <Alert color="error">
                Failed to create:{" "}
                {getAPIErrorMessage(createDocumentBoxMutation.error)}
              </Alert>
            )}

            <DialogActions>
              <Button
                type="submit"
                variant="contained"
                loading={createDocumentBoxMutation.isPending}
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
