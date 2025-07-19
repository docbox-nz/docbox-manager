export const tenantKeys = {
  tenants: ["tenant", "list"],
  createTenant: ["tenant", "create"],
  migrateTenant: ["tenant", "migrate"],
  tenant: (env: string, tenantId: string) => ["tenant", env, tenantId],
};
