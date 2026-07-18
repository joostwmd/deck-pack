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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {session.user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
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
