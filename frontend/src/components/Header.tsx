import { useLogout } from "@/api/auth/auth.mutations";
import Button from "@mui/material/Button";
import { Link } from "@tanstack/react-router";

export default function Header() {
  const logoutMutation = useLogout();

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/tanstack-query">TanStack Query</Link>
        </div>

        <Button
          onClick={() => logoutMutation.mutate()}
          loading={logoutMutation.isPending}
        >
          Logout
        </Button>
      </nav>
    </header>
  );
}
