import { fData } from "@/utils/format-number";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useDropzone } from "react-dropzone";
import FileTypeIcon from "@docbox-nz/docbox-ui/components/FileTypeIcon";
import { getFileTypeFromMime } from "@docbox-nz/docbox-ui";
import LinearProgress from "@mui/material/LinearProgress";
import MdiDelete from "~icons/mdi/delete";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
type FormUploadFileProps = {
  field: AnyFieldApi;
};

type FileMaybeProgress = File & {
  progress?: {
    name: string;
    progress?: number;
  };
};

export default function FormUploadFile({ field }: FormUploadFileProps) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop(acceptedFiles, fileRejections, event) {
      field.setValue((currentValue: File[]) => [
        ...currentValue,
        ...acceptedFiles,
      ]);
    },
  });

  return (
    <Stack spacing={1}>
      <Card
        {...getRootProps({ className: "dropzone" })}
        variant="outlined"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 200,
          width: 400,
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        <Typography sx={{ maxWidth: 300 }}>
          Drag 'n' drop some files here, or click to select files
        </Typography>
      </Card>

      <Stack
        spacing={1}
        sx={{
          maxHeight: 300,
          overflow: "auto",
        }}
      >
        {(field.state.value as FileMaybeProgress[]).map((file, index) => (
          <Stack
            component={Paper}
            key={index}
            direction="row"
            justifyContent="space-between"
            sx={{ px: 1 }}
            alignItems="center"
          >
            <Stack direction="row" alignItems="center" sx={{ flexGrow: 1 }}>
              <FileTypeIcon
                sx={{ width: 32, height: 32, mr: 1 }}
                fileType={getFileTypeFromMime(file.type)}
              />

              <Stack sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {fData(file.size)}
                </Typography>

                {file.progress !== undefined && (
                  <Stack>
                    {file.progress.progress ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            {file.progress.name}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: "auto", mx: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={file.progress.progress * 100}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >{`${Math.round(file.progress.progress * 100)}%`}</Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            {file.progress.name}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: "auto", mx: 1 }}>
                          <LinearProgress variant="indeterminate" />
                        </Box>
                      </Box>
                    )}
                  </Stack>
                )}
              </Stack>
            </Stack>

            <IconButton
              size="small"
              sx={{ m: 1 }}
              onClick={() => {
                field.setValue((files: File[]) => {
                  return files.filter((otherFile) => file !== otherFile);
                });
              }}
            >
              <MdiDelete />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
