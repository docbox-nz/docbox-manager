import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tenant/$env/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { env, id } = Route.useParams();

  return (
    <div>
      Hello "/tenant/{env}/{id}"!
    </div>
  );
}
