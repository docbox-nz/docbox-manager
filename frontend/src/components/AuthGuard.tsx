import { useAuthenticated } from "@/api/auth/auth.queries";
import type { PropsWithChildren } from "react";
import LoginPage from "./LoginPage";
import LoadingPage from "./LoadingPage";

export function AuthGuard({ children }: PropsWithChildren<{}>) {
  const { data, isError, isLoading } = useAuthenticated();

  if (isError) {
    return null;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  const authenticated = data ?? false;
  if (!authenticated) {
    return <LoginPage />;
  }

  return children;
}
