import {
  GeneratedFileType,
  type DocFile,
  type DocumentBoxScope,
} from "@docbox-nz/docbox-sdk";
import { DocboxPdfPreviewDialog } from "@docbox-nz/docbox-ui";
import { useDocboxClient, useDocboxEndpoint } from "./DocboxProvider";
import { useFile } from "@/api/docbox/docbox.queries";
import { FilePreviewType, getFilePreviewType } from "@docbox-nz/docbox-ui";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";

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
  const { data: resolved } = useFile(scope, file.id);
  const generatedFiles =
    resolved?.generated?.map((generated) => generated.type) ?? [];

  const client = useDocboxClient();

  const previewFormat = getFilePreviewType(file.mime, generatedFiles);
  const endpoint = useDocboxEndpoint();

  const downloadURL = endpoint(
    client.file.rawNamedURL(scope, file.id, file.name)
  );

  // PDF files
  if (previewFormat === FilePreviewType.PDF) {
    const previewURL = endpoint(
      client.file.rawNamedURL(scope, file.id, file.name)
    );

    return (
      <DocboxPdfPreviewDialog
        open={open}
        onClose={onClose}
        fileName={file.name}
        previewURL={previewURL}
        downloadURL={downloadURL}
      />
    );
  }

  // Support for "generated" PDFs
  if (previewFormat === FilePreviewType.GENERATED_PDF) {
    const previewURL = endpoint(
      client.file.generatedRawNamedURL(
        scope,
        file.id,
        GeneratedFileType.PDF,
        file.name
      )
    );

    return (
      <DocboxPdfPreviewDialog
        open={open}
        onClose={onClose}
        fileName={file.name}
        previewURL={previewURL}
        downloadURL={downloadURL}
        generated
      />
    );
  }

  if (previewFormat === FilePreviewType.IMAGE) {
    const previewURL = endpoint(
      client.file.rawNamedURL(scope, file.id, file.name)
    );

    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box component="img" src={previewURL} />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
