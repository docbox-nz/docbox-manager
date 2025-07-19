import {
  useUpdateFile,
  useUpdateFolder,
  useUpdateLink,
} from "@/api/docbox/docbox.mutations";
import {
  DocboxItemType,
  type DocboxItem,
  type DocumentBoxScope,
} from "@docbox-nz/docbox-sdk";
import Checkbox from "@mui/material/Checkbox";

type Props = {
  item: DocboxItem;
  scope: DocumentBoxScope;
};

export default function DocboxItemPinned({ item, scope }: Props) {
  const { mutate: updateFile, isPending: updatingFile } = useUpdateFile();
  const { mutate: updateLink, isPending: updatingLink } = useUpdateLink();
  const { mutate: updateFolder, isPending: updatingFolder } = useUpdateFolder();

  return (
    <Checkbox
      checked={item.pinned ?? false}
      onChange={(_event, value) => {
        switch (item.type) {
          case DocboxItemType.File: {
            updateFile({ scope, file_id: item.id, data: { pinned: value } });
            break;
          }
          case DocboxItemType.Folder: {
            updateFolder({
              scope,
              folder_id: item.id,
              data: { pinned: value },
            });
            break;
          }
          case DocboxItemType.Link: {
            updateLink({
              scope,
              link_id: item.id,
              data: { pinned: value },
            });
            break;
          }
        }
      }}
      disabled={updatingFile || updatingLink || updatingFolder}
    />
  );
}
