export const tenantKeys = {
  tenants: ["tenant", "list"],
  createTenant: ["tenant", "create"],
  tenant: (env: string, tenantId: string) => ["tenant", env, tenantId],
};
