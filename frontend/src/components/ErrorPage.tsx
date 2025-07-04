import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

type Props = {
  error: string;
};

export default function ErrorPage({ error }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Alert color="error">{error}</Alert>
    </Box>
  );
}
