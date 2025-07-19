import type {
  DocboxClient,
  DocFile,
  DocFolder,
  DocLink,
  DocumentBoxResponse,
  DocumentBoxScope,
  DocumentBoxStats,
  FileId,
  FileResponse,
  FolderId,
  FolderResponse,
  LinkId,
  ResolvedFolder,
  UpdateFile,
  UpdateFolder,
  UpdateLink,
} from "@docbox-nz/docbox-sdk";
import type { QueryClient } from "@tanstack/react-query";
import { docboxKeys } from "./docbox.keys";

export function invalidateSearch(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: string
) {
  queryClient.invalidateQueries({
    queryKey: docboxKeys.instance(client).boxes.specific(scope).search.root,
    exact: false,
  });
}

export function mutateResolvedFolder(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  folder_id: FolderId,
  action: (folder: ResolvedFolder) => ResolvedFolder
) {
  // Update the resolved children from a folder response
  queryClient.setQueryData<FolderResponse>(
    docboxKeys.instance(client).boxes.specific(scope).folder.specific(folder_id)
      .root,
    (folder) => {
      if (folder === undefined) return undefined;
      return {
        ...folder,
        children: action(folder.children),
      };
    }
  );

  // Updates the resolved children from document box root folders
  queryClient.setQueryData<DocumentBoxResponse>(
    docboxKeys.instance(client).boxes.specific(scope).root,
    (document_box) => {
      if (document_box === undefined) return undefined;

      // eslint-disable-next-line prefer-destructuring
      let children: ResolvedFolder = document_box.children;
      if (document_box.root.id === folder_id) {
        children = action(children);
      }

      return {
        ...document_box,
        children,
      };
    }
  );
}

export function mutateResolvedFolders(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  action: (folder: ResolvedFolder, folder_id: FolderId) => ResolvedFolder
) {
  // Mutate all the folder responses
  queryClient.setQueriesData<FolderResponse>(
    {
      // TODO: THIS WILL BREAK EDIT HISTORY
      queryKey: docboxKeys.instance(client).boxes.specific(scope).folder.root,
      exact: false,
    },
    (folder) => {
      if (folder === undefined) return undefined;
      return {
        ...folder,
        children: action(folder.children, folder.folder.id),
      };
    }
  );

  // Mutate the document box resolved children
  queryClient.setQueryData<DocumentBoxResponse>(
    docboxKeys.instance(client).boxes.specific(scope).root,
    (document_box) => {
      if (document_box === undefined) return undefined;

      return {
        ...document_box,
        children: action(document_box.children, document_box.root.id),
      };
    }
  );
}

export function invalidateFile(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  fileId: FileId
) {
  queryClient.invalidateQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .file.specific(fileId).root,
    exact: false,
  });
}

export function invalidateFolder(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  folderId: FolderId
) {
  queryClient.invalidateQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .folder.specific(folderId).root,
    exact: false,
  });
}

export function invalidateLink(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  linkId: LinkId
) {
  queryClient.invalidateQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .link.specific(linkId).root,
    exact: false,
  });
}

export function mutateFileUploadComplete(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  response: FileResponse
) {
  // Store the updated file data
  queryClient.setQueryData(
    docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .file.specific(response.file.id).root,
    () => response
  );

  // Add the file to its folder
  mutateResolvedFolder(
    queryClient,
    client,
    scope,
    response.file.folder_id,
    (folder) => ({
      ...folder,
      files: [...folder.files, response.file],
    })
  );

  // Update the files counter
  queryClient.setQueryData<DocumentBoxStats>(
    docboxKeys.instance(client).boxes.specific(scope).stats,
    (stats) => {
      if (stats === undefined) return undefined;
      return {
        ...stats,
        total_files: stats.total_files + 1,
      };
    }
  );

  // Mutate search results
  invalidateSearch(queryClient, client, scope);

  // TODO: Also apply "additional files" probably requires an invalidation
}

export function mutateUpdateFile(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  file_id: FileId,
  data: UpdateFile
) {
  const updateFile = (file: DocFile): DocFile => ({
    ...file,
    name: data.name ?? file.name,
    folder_id: data.folder_id ?? file.folder_id,
    pinned: data.pinned ?? file.pinned,
  });

  // Update the stored file
  queryClient.setQueryData<FileResponse>(
    docboxKeys.instance(client).boxes.specific(scope).file.specific(file_id)
      .root,
    (file) => {
      if (file === undefined) return undefined;
      return {
        ...file,
        file: updateFile(file.file),
      };
    }
  );

  // Invalidate all associated file queries
  queryClient.invalidateQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .file.specific(file_id).root,
    exact: false,
  });

  let existing: DocFile | undefined;

  // Update all data from resolved folders
  mutateResolvedFolders(queryClient, client, scope, (folder) => {
    // Update existing folders
    let files = folder.files.map((file) => {
      if (file.id === file_id) {
        const newFile = updateFile(file);
        existing = newFile;
        return newFile;
      }
      return file;
    });

    // Remove the file from the folder
    if (data.folder_id !== null && data.folder_id !== undefined) {
      files = files.filter((file) => file.id !== file_id);
    }

    return {
      ...folder,
      files,
    };
  });

  if (data.folder_id !== null && data.folder_id !== undefined) {
    // Refresh the target folder contents and place the file in the new folder
    mutateResolvedFolder(
      queryClient,
      client,
      scope,
      data.folder_id,
      (folder) => ({
        ...folder,
        files: existing ? [...folder.files, existing] : [],
      })
    );

    if (existing === undefined) {
      invalidateFolder(queryClient, client, scope, data.folder_id);
    }
  }

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}

export function mutateDeleteFile(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  file_id: FileId
) {
  // Remove the stored file data
  queryClient.removeQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .file.specific(file_id).root,
    exact: false,
  });

  // Remove from all folders
  mutateResolvedFolders(queryClient, client, scope, (folder) => ({
    ...folder,
    files: folder.files.filter((value) => value.id !== file_id),
  }));

  // Update the files counter
  queryClient.setQueryData<DocumentBoxStats>(
    docboxKeys.instance(client).boxes.specific(scope).stats,
    (stats) => {
      if (stats === undefined) return undefined;
      return {
        ...stats,
        total_files: stats.total_files - 1,
      };
    }
  );

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}

export function mutateCreateFolder(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  response: FolderResponse
) {
  // Add the local folder data
  queryClient.setQueryData<FolderResponse>(
    docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .folder.specific(response.folder.id).root,
    response
  );

  // Add the folder to its parent folder
  if (response.folder.folder_id) {
    mutateResolvedFolder(
      queryClient,
      client,
      scope,
      response.folder.folder_id,
      (folder) => ({
        ...folder,
        folders: [...folder.folders, response.folder],
      })
    );
  }

  // Update the folders counter
  queryClient.setQueryData<DocumentBoxStats>(
    docboxKeys.instance(client).boxes.specific(scope).stats,
    (stats) => {
      if (stats === undefined) return undefined;
      return {
        ...stats,
        total_folders: stats.total_folders + 1,
      };
    }
  );

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}

export function mutateUpdateFolder(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  folder_id: FolderId,
  data: UpdateFolder
) {
  const updateFolder = (folder: DocFolder): DocFolder => ({
    ...folder,
    name: data.name ?? folder.name,
    folder_id: data.folder_id ?? folder.folder_id,
    pinned: data.pinned ?? folder.pinned,
  });

  // Mutate the folder itself
  queryClient.setQueryData<FolderResponse>(
    docboxKeys.instance(client).boxes.specific(scope).folder.specific(folder_id)
      .root,
    (folder) => {
      if (folder === undefined) return undefined;
      return {
        ...folder,
        folder: updateFolder(folder.folder),
      };
    }
  );

  // Request latest folder data
  queryClient.invalidateQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .folder.specific(folder_id).root,
    exact: false,
  });

  // Mutate the parent folder
  mutateResolvedFolders(queryClient, client, scope, (folder) => ({
    ...folder,
    folders: folder.folders.map((folder) => {
      if (folder.id === folder_id) return updateFolder(folder);
      return folder;
    }),
  }));

  let existing: DocFolder | undefined;

  // Update all data from resolved folders
  mutateResolvedFolders(queryClient, client, scope, (folder) => {
    // Update existing folders
    let folders = folder.folders.map((folders) => {
      if (folders.id === folder_id) {
        const newLink = updateFolder(folders);
        existing = newLink;
        return newLink;
      }
      return folders;
    });

    // Remove the file from the folder
    if (data.folder_id !== null && data.folder_id !== undefined) {
      folders = folders.filter((folder) => folder.id !== folder_id);
    }

    return {
      ...folder,

      // Update all resolved paths
      path: folder.path.map((path) => {
        if (path.id === folder_id) {
          return { id: folder_id, name: data.name ?? path.name };
        }

        return path;
      }),
      folders,
    };
  });

  if (data.folder_id !== null && data.folder_id !== undefined) {
    // Refresh the target folder contents and place the link in the new folder
    mutateResolvedFolder(
      queryClient,
      client,
      scope,
      data.folder_id,
      (folder) => ({
        ...folder,
        folders: existing ? [...folder.folders, existing] : [],
      })
    );

    if (existing === undefined) {
      invalidateFolder(queryClient, client, scope, data.folder_id);
    }
  }

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}

export function mutateDeleteFolder(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  folder_id: FolderId
) {
  // Clear the stored folder data

  queryClient.removeQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .folder.specific(folder_id).root,
    exact: false,
  });

  // Remove from all folders
  mutateResolvedFolders(queryClient, client, scope, (folder) => ({
    ...folder,
    folders: folder.folders.filter((value) => value.id !== folder_id),
  }));

  // Remove all folders where their parent path includes a path to the deleted folder
  queryClient.removeQueries({
    queryKey: docboxKeys.instance(client).boxes.specific(scope).folder.root,
    predicate: (item) => {
      const folder = queryClient.getQueryData<FolderResponse>(item.queryKey);
      if (folder === undefined) return false;

      const includesRemoved =
        folder.children.path.find((value) => value.id === folder_id) !==
        undefined;

      return includesRemoved;
    },
  });

  // Update the folders counter
  queryClient.setQueryData<DocumentBoxStats>(
    docboxKeys.instance(client).boxes.specific(scope).stats,
    (stats) => {
      if (stats === undefined) return undefined;
      return {
        ...stats,
        total_folders: stats.total_folders - 1,
      };
    }
  );

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}

export function mutateCreateLink(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  response: DocLink
) {
  // Store the create link data
  queryClient.setQueryData<DocLink>(
    docboxKeys.instance(client).boxes.specific(scope).link.specific(response.id)
      .root,
    () => response
  );

  // Add the link to its folder
  mutateResolvedFolder(
    queryClient,
    client,
    scope,
    response.folder_id,
    (folder) => ({
      ...folder,
      links: [...folder.links, response],
    })
  );

  // Update the links counter
  queryClient.setQueryData<DocumentBoxStats>(
    docboxKeys.instance(client).boxes.specific(scope).stats,
    (stats) => {
      if (stats === undefined) return undefined;
      return {
        ...stats,
        total_links: stats.total_links + 1,
      };
    }
  );

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}

export function mutateUpdateLink(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  link_id: LinkId,
  data: UpdateLink
) {
  const updateLink = (link: DocLink): DocLink => ({
    ...link,
    name: data.name ?? link.name,
    value: data.value ?? link.value,
    folder_id: data.folder_id ?? link.folder_id,
    pinned: data.pinned ?? link.pinned,
  });

  // Mutate the link itself
  queryClient.setQueryData<DocLink>(
    docboxKeys.instance(client).boxes.specific(scope).link.specific(link_id)
      .root,
    (link) => {
      if (link === undefined) return undefined;
      return updateLink(link);
    }
  );

  // Invalidate link and all its data
  invalidateLink(queryClient, client, scope, link_id);

  // Mutate the parent folder
  mutateResolvedFolders(queryClient, client, scope, (folder) => ({
    ...folder,
    links: folder.links.map((link) => {
      if (link.id === link_id) return updateLink(link);
      return link;
    }),
  }));

  let existing: DocLink | undefined;

  // Update all data from resolved folders
  mutateResolvedFolders(queryClient, client, scope, (folder) => {
    // Update existing folders
    let links = folder.links.map((links) => {
      if (links.id === link_id) {
        const newLink = updateLink(links);
        existing = newLink;
        return newLink;
      }
      return links;
    });

    // Remove the file from the folder
    if (data.folder_id !== null && data.folder_id !== undefined) {
      links = links.filter((link) => link.id !== link_id);
    }

    return {
      ...folder,
      links,
    };
  });

  if (data.folder_id !== null && data.folder_id !== undefined) {
    // Refresh the target folder contents and place the link in the new folder
    mutateResolvedFolder(
      queryClient,
      client,
      scope,
      data.folder_id,
      (folder) => ({
        ...folder,
        links: existing ? [...folder.links, existing] : [],
      })
    );

    if (existing === undefined) {
      invalidateFolder(queryClient, client, scope, data.folder_id);
    }
  }

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}

export function mutateDeleteLink(
  queryClient: QueryClient,
  client: DocboxClient,
  scope: DocumentBoxScope,
  link_id: LinkId
) {
  // Remove stored link data
  queryClient.removeQueries({
    queryKey: docboxKeys
      .instance(client)
      .boxes.specific(scope)
      .link.specific(link_id).root,
    exact: false,
  });

  // Remove from all folders
  mutateResolvedFolders(queryClient, client, scope, (folder) => ({
    ...folder,
    links: folder.links.filter((value) => value.id !== link_id),
  }));

  // Update the links counter
  queryClient.setQueryData<DocumentBoxStats>(
    docboxKeys.instance(client).boxes.specific(scope).stats,
    (stats) => {
      if (stats === undefined) return undefined;
      return {
        ...stats,
        total_links: stats.total_links - 1,
      };
    }
  );

  // Mutate search results
  invalidateSearch(queryClient, client, scope);
}
