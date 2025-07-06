import { useDocumentBox } from "@/api/docbox/docbox.queries";
import type { DocFolder, ResolvedFolder } from "@docbox-nz/docbox-sdk";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import CreateDocumentBoxDialog from "./CreateDocumentBoxDialog";
import DocumentBoxesTable from "./DocumentBoxesTable";
import UploadFileDialog from "./UploadFileDialog";
import LinearProgress from "@mui/material/LinearProgress";
import DocumentBoxBrowser from "./browser/DocumentBoxBrower";
import IconButton from "@mui/material/IconButton";
import MdiChevronLeft from "~icons/mdi/chevron-left";
import CreateFolderDialog from "./CreateFolderDialog";

type Props = {
  scope?: string;
  folder_id?: string;

  onClearScope: VoidFunction;
};

type ActiveFolder = { folder: DocFolder; children: ResolvedFolder };

export default function TenantFileBrowser({
  scope,
  folder_id,
  onClearScope,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    data: documentBox,
    error: documentBoxError,
    isLoading: documentBoxLoading,
  } = useDocumentBox(scope);

  const activeFolder: ActiveFolder | undefined = useMemo(() => {
    // TODO: If folder loading | error return undefined
    // TODO: If folder return folderId

    if (documentBoxLoading || documentBoxError || !documentBox)
      return undefined;

    return { folder: documentBox.root, children: documentBox.children };
  }, [documentBox]);

  if (scope === undefined) {
    return (
      <>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1, py: 2 }}
        >
          <Typography variant="h6">Document Boxes</Typography>
          <Button onClick={() => setCreateOpen(true)}>Create Box</Button>

          <CreateDocumentBoxDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />
        </Stack>
        <DocumentBoxesTable />
      </>
    );
  }

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1, py: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={onClearScope}>
            <MdiChevronLeft />
          </IconButton>

          <Typography variant="h6">{scope}</Typography>
        </Stack>

        {activeFolder && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => setCreateFolderOpen(true)}
            >
              Create Folder
            </Button>

            <Button variant="outlined" onClick={() => setUploadOpen(true)}>
              Upload File
            </Button>

            <UploadFileDialog
              open={uploadOpen}
              onClose={() => setUploadOpen(false)}
              folder_id={activeFolder.folder.id}
              scope={scope}
            />

            <CreateFolderDialog
              open={createFolderOpen}
              onClose={() => setCreateFolderOpen(false)}
              folder_id={activeFolder.folder.id}
              scope={scope}
            />
          </Stack>
        )}
      </Stack>

      {documentBoxLoading && <LinearProgress />}
      {activeFolder && <DocumentBoxBrowser folder={activeFolder.children} />}
    </>
  );
}
