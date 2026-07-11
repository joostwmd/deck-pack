import { Button } from "@deck-pack/ui/components/system/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@deck-pack/ui/components/system/dropdown-menu";
import { Skeleton } from "@deck-pack/ui/components/system/skeleton";
import { cn } from "@deck-pack/ui/lib/utils";
import { SignOut, UserCircle } from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";

import { getUserInitials } from "@/lib/user-initials";
import { authClient } from "@/utils/auth";

export function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!session) {
    return null;
  }

  const initials = getUserInitials({
    name: session.user.name,
    email: session.user.email,
  });

  const displayName = session.user.name?.trim() || session.user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={`Account menu for ${displayName}`}
          />
        }
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground",
          )}
        >
          {initials}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/account" />}>
            <UserCircle className="size-4" />
            My account
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    void navigate({
                      to: "/login",
                    });
                  },
                },
              });
            }}
          >
            <SignOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
