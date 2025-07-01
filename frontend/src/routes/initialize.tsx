import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/initialize")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Initialize</h1>
      <p>
        The connected <b>Docbox</b> server does not appear to be initialized,
        press the button below to initialize the server.
      </p>
      <button>Initialize</button>
    </div>
  );
}
