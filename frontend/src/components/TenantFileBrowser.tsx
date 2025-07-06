import { useDocumentBox, useFolder } from "@/api/docbox/docbox.queries";
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
import Alert from "@mui/material/Alert";
import { getAPIErrorMessage } from "@/api/axios";
import RouterLink from "./RouterLink";
import { isNil } from "@/utils/nullable";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import CreateLinkDialog from "./CreateLinkDialog";

type Props = {
  scope?: string;
  folder_id?: string;
};

type ActiveFolder = { folder: DocFolder; children: ResolvedFolder };

export default function TenantFileBrowser({ scope, folder_id }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createLinkOpen, setCreateLinkOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    data: documentBox,
    error: documentBoxError,
    isLoading: documentBoxLoading,
  } = useDocumentBox(scope);

  const {
    data: folder,
    error: folderError,
    isLoading: folderLoading,
  } = useFolder(scope, folder_id);

  const activeFolder: ActiveFolder | undefined = useMemo(() => {
    if (folderLoading || folderError || (!folder && !isNil(folder_id))) {
      return undefined;
    }

    if (folder) {
      return { folder: folder.folder, children: folder.children };
    }

    if (documentBoxLoading || documentBoxError || !documentBox)
      return undefined;

    return { folder: documentBox.root, children: documentBox.children };
  }, [documentBox, folder]);

  // Document box selection
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
          <IconButton
            size="small"
            component={RouterLink}
            to="."
            search={(search) => {
              // Currently within a nested directory, back out
              if (
                activeFolder &&
                documentBox &&
                activeFolder.folder.folder_id !== null
              ) {
                const isRoot =
                  activeFolder.folder.folder_id !== documentBox.root.id;

                return {
                  ...search,
                  folder: isRoot
                    ? (activeFolder.folder.folder_id ?? undefined)
                    : undefined,
                };
              }

              return { ...search, scope: undefined };
            }}
          >
            <MdiChevronLeft />
          </IconButton>

          <Stack sx={{ pl: 2 }}>
            <Breadcrumbs aria-label="breadcrumb">
              <Link
                underline="hover"
                component={RouterLink}
                to="."
                search={(search) => ({ ...search, folder: undefined })}
                color="inherit"
              >
                {scope}
              </Link>

              {activeFolder &&
                activeFolder.children.path.map((path, index) => {
                  if (index === 0) {
                    return null;
                  }

                  return (
                    <Link
                      key={path.id}
                      underline="hover"
                      component={RouterLink}
                      to="."
                      search={(search) => ({ ...search, folder: path.id })}
                      color="inherit"
                    >
                      {path.name}
                    </Link>
                  );
                })}
              {activeFolder && activeFolder.folder.folder_id !== null && (
                <Link
                  underline="hover"
                  component={RouterLink}
                  to="."
                  search={(search) => search}
                  color="text.primary"
                >
                  {activeFolder.folder.name}
                </Link>
              )}
            </Breadcrumbs>
          </Stack>
        </Stack>

        {activeFolder && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => setCreateFolderOpen(true)}
            >
              Create Folder
            </Button>

            <Button variant="outlined" onClick={() => setCreateLinkOpen(true)}>
              Create Link
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

            <CreateLinkDialog
              open={createLinkOpen}
              onClose={() => setCreateLinkOpen(false)}
              folder_id={activeFolder.folder.id}
              scope={scope}
            />
          </Stack>
        )}
      </Stack>

      {documentBoxError && (
        <Alert color="error">
          Failed to load: {getAPIErrorMessage(documentBoxError)}
        </Alert>
      )}

      {folderError && (
        <Alert color="error">
          Failed to load: {getAPIErrorMessage(folderError)}
        </Alert>
      )}

      {documentBoxLoading && <LinearProgress />}
      {folderLoading && <LinearProgress />}
      {activeFolder && <DocumentBoxBrowser folder={activeFolder.children} />}
    </>
  );
}
