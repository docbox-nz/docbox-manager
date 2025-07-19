import { getAPIErrorMessage } from "@/api/axios";
import { useMigrateTenants } from "@/api/root/root.mutations";
import Button from "@mui/material/Button";
import { toast } from "sonner";

export default function TenantsMigrateButton() {
  const { isPending, mutate } = useMigrateTenants();

  return (
    <Button
      variant="contained"
      loading={isPending}
      onClick={() => {
        mutate(undefined, {
          onSuccess() {
            toast.success("Migration success");
          },
          onError(error) {
            console.error(error);
            toast.error(
              `Failed to migrate tenants: ${getAPIErrorMessage(error)}`
            );
          },
        });
      }}
    >
      Migrate All
    </Button>
  );
}
