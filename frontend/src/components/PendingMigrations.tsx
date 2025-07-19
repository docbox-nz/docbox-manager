import type { TenantWithMigrations } from "@/api/root/root.types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import TenantMigrateButton from "./TenantMigrateButton";
import TenantsMigrateButton from "./TenantsMigrateButton";

type Props = {
  tenants: TenantWithMigrations[];
};

export function PendingMigrations({ tenants }: Props) {
  const totalMigrations = useMemo(() => {
    let totalMigrations = 0;

    for (const tenant of tenants) {
      totalMigrations += tenant.migrations.length;
    }

    return totalMigrations;
  }, [tenants]);

  const environments = useMemo(() => {
    const envs = new Map<string, TenantWithMigrations[]>();

    for (const tenant of tenants) {
      if (tenant.migrations.length < 1) {
        continue;
      }

      if (!envs.has(tenant.tenant.env)) {
        envs.set(tenant.tenant.env, []);
      }

      envs.get(tenant.tenant.env)!.push(tenant);
    }

    return [...envs.entries()].map(([env, tenants]) => ({
      env,
      tenants,
    }));
  }, [tenants]);

  return (
    <Card sx={{ m: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1, py: 1 }}
        >
          <Typography variant="h6">Pending Migrations</Typography>
        </Stack>

        {totalMigrations === 0 && (
          <Typography color="text.secondary" sx={{ px: 1 }}>
            No pending migrations, all tenants are up-to-date
          </Typography>
        )}

        {totalMigrations > 0 && (
          <Stack spacing={2} alignItems="flex-start" sx={{ mt: 2 }}>
            <TenantsMigrateButton />

            <Stack sx={{ px: 1, py: 1, width: 1 }} spacing={2}>
              {environments.map(({ env, tenants }) => (
                <Stack key={env} spacing={2}>
                  <Typography variant="subtitle2">{env}</Typography>

                  {tenants.map(({ tenant, migrations }) => (
                    <Card variant="outlined" sx={{ p: 2 }} key={tenant.id}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography>{tenant.id}</Typography>
                        <Typography flex="auto">{tenant.name}</Typography>
                        <Typography>Pending {migrations.length}</Typography>
                        <TenantMigrateButton id={tenant.id} env={tenant.env} />
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
