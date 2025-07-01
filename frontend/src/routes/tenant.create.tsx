import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tenant/create")({
  component: TenantCreate,
});

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
});

function TenantCreate() {
  return <div></div>;
}
