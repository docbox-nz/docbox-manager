import { useDocumentBox } from "@/api/docbox/docbox.queries";
import {
  DocboxItemType,
  type DocboxItem,
  type ResolvedFolder,
} from "@docbox-nz/docbox-sdk";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import DocumentBoxBrowser from "./DocumentBoxBrower";

type Props = {
  scope: string;
};

export default function DocumentBoxBrowserLoader({ scope }: Props) {
  const {
    data: documentBox,
    error: documentBoxError,
    isLoading: documentBoxLoading,
  } = useDocumentBox(scope);

  if (documentBoxLoading) {
    return null;
  }

  if (documentBoxError || !documentBox) {
    return null;
  }

  return <DocumentBoxBrowser folder={documentBox.children} />;
}
