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

export interface UserMenuViewProps {
  isPending: boolean;
  initials?: string;
  displayName?: string;
  onAccountClick: () => void;
  onSignOut: () => void;
}

export function UserMenuView({
  isPending,
  initials,
  displayName,
  onAccountClick,
  onSignOut,
}: UserMenuViewProps) {
  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!initials || !displayName) {
    return null;
  }

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
          <DropdownMenuItem onClick={onAccountClick}>
            <UserCircle className="size-4" />
            My account
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onSignOut}>
            <SignOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
