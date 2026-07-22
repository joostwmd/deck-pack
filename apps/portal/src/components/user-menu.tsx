import { env } from "@deck-pack/env/web";
import { Button } from "@deck-pack/ui/components/system/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@deck-pack/ui/components/system/dropdown-menu";
import { Skeleton } from "@deck-pack/ui/components/system/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useServices } from "@/services/services-context";

export default function UserMenu() {
  const navigate = useNavigate();
  const { auth } = useServices();
  const { data: session, isPending } = auth.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link to="/">
        <Button variant="outline">Sign in</Button>
      </Link>
    );
  }

  const impersonatedBy = (session.session as { impersonatedBy?: string | null }).impersonatedBy;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {session.user.name}
        {impersonatedBy ? " (impersonating)" : ""}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          {impersonatedBy ? (
            <DropdownMenuItem
              onClick={() => {
                void (async () => {
                  const result = await auth.stopImpersonating();
                  if (result.error) {
                    toast.error(result.error.message ?? "Could not stop impersonating");
                    return;
                  }
                  toast.success("Stopped impersonating");
                  window.location.assign(`${env.VITE_OPS_URL}/users`);
                })();
              }}
            >
              Stop impersonating
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void auth.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    void navigate({
                      to: "/",
                    });
                  },
                },
              });
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
