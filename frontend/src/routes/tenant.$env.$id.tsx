import DocboxProvider from "@/components/DocboxProvider";
import DocumentBoxesTable from "@/components/DocumentBoxesTable";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tenant/$env/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { env, id } = Route.useParams();

  return (
    <DocboxProvider tenantId={id} env={env}>
      Hello "/tenant/{env}/{id}"!
      <DocumentBoxesTable />
    </DocboxProvider>
  );
}
