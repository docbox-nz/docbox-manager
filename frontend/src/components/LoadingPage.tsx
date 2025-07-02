import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export default function LoadingPage() {
  return (
    <Box sx={{ height: 1 }}>
      <CircularProgress />
    </Box>
  );
}
