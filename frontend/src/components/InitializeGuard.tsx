import type { PropsWithChildren } from "react";
import { useInitialized } from "@/api/root/root.queries";
import LoadingPage from "./LoadingPage";
import InitializePage from "./InitializePage";

export function InitializeGuard({ children }: PropsWithChildren<{}>) {
  const { data, isError, isLoading } = useInitialized();

  if (isError) {
    return null;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  const authenticated = data ?? false;
  if (!authenticated) {
    return <InitializePage />;
  }

  return children;
}
