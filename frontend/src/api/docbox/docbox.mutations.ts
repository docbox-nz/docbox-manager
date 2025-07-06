import { useMutation, useQueryClient } from "@tanstack/react-query";
import { docboxKeys } from "./docbox.keys";
import { useDocboxClient } from "@/components/DocboxProvider";
import { queryClient } from "@/integrations/tanstack-query/root-provider";
import type {
  CreateFolder,
  CreateLink,
  DocumentBoxScope,
  FileId,
  FolderId,
  LinkId,
  PresignedUploadOptions,
  UpdateFile,
  UpdateFolder,
  UpdateLink,
} from "@docbox-nz/docbox-sdk";
import {
  mutateCreateFolder,
  mutateCreateLink,
  mutateDeleteFile,
  mutateDeleteFolder,
  mutateDeleteLink,
  mutateFileUploadComplete,
  mutateUpdateFile,
  mutateUpdateFolder,
  mutateUpdateLink,
} from "./docbox.mutators";

export function useCreateDocumentBox() {
  const client = useDocboxClient();
  return useMutation({
    mutationFn: ({ scope }: { scope: string }) =>
      client.documentBox.create(scope, false),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: docboxKeys.instance(client).boxes.root,
      });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      folder_id,
      file,
      options,
    }: {
      scope: DocumentBoxScope;
      folder_id: FolderId;
      file: File;
      options?: PresignedUploadOptions;
    }) => client.file.uploadPresigned(scope, folder_id, file, options),
    onSuccess: (response, { scope }) =>
      mutateFileUploadComplete(queryClient, client, scope, response),
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      file_id,
      data,
    }: {
      scope: DocumentBoxScope;
      file_id: FileId;
      data: UpdateFile;
    }) => client.file.update(scope, file_id, data),
    onSuccess: (_data, { scope, file_id, data }) =>
      mutateUpdateFile(queryClient, client, scope, file_id, data),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      file_id,
    }: {
      scope: DocumentBoxScope;
      file_id: FileId;
    }) => client.file.delete(scope, file_id),
    onSuccess: (_data, { scope, file_id }) =>
      mutateDeleteFile(queryClient, client, scope, file_id),
  });
}
export function useCreateLink() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      data,
    }: {
      scope: DocumentBoxScope;
      data: CreateLink;
    }) => client.link.create(scope, data),
    onSuccess: (res, { scope }) =>
      mutateCreateLink(queryClient, client, scope, res),
  });
}

export function useUpdateLink() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      link_id,
      data,
    }: {
      scope: DocumentBoxScope;
      link_id: LinkId;
      data: UpdateLink;
    }) => client.link.update(scope, link_id, data),
    onSuccess: (_data, { scope, link_id, data }) =>
      mutateUpdateLink(queryClient, client, scope, link_id, data),
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      link_id,
    }: {
      scope: DocumentBoxScope;
      link_id: LinkId;
    }) => client.link.delete(scope, link_id),
    onSuccess: (_data, { scope, link_id }) =>
      mutateDeleteLink(queryClient, client, scope, link_id),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({ scope, data }: { scope: string; data: CreateFolder }) =>
      client.folder.create(scope, data),
    onSuccess: (response, { scope }) =>
      mutateCreateFolder(queryClient, client, scope, response),
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      folder_id,
      data,
    }: {
      scope: DocumentBoxScope;
      folder_id: FolderId;
      data: UpdateFolder;
    }) => client.folder.update(scope, folder_id, data),
    onSuccess: (_data, { scope, folder_id, data }) =>
      mutateUpdateFolder(queryClient, client, scope, folder_id, data),
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const client = useDocboxClient();

  return useMutation({
    mutationFn: ({
      scope,
      folder_id,
    }: {
      scope: DocumentBoxScope;
      folder_id: FolderId;
    }) => client.folder.delete(scope, folder_id),
    onSuccess: (_data, { scope, folder_id }) =>
      mutateDeleteFolder(queryClient, client, scope, folder_id),
  });
}
