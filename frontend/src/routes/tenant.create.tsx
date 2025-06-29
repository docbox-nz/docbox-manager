import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tenant/create")({
  component: TenantCreate,
});

function TenantCreate() {
  return <div></div>;
}
