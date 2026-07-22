import { env } from "@deck-pack/env/web";
import { Avatar, AvatarFallback, AvatarImage } from "@deck-pack/ui/components/system/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@deck-pack/ui/components/system/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@deck-pack/ui/components/system/sidebar";
import { DotsThreeVerticalIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useServices } from "@/services/services-context";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function SidebarUserMenu() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { auth } = useServices();
  const { data: session, isPending } = auth.useSession();

  if (isPending || !session) {
    return null;
  }

  const user = session.user;
  const impersonatedBy = (session.session as { impersonatedBy?: string | null }).impersonatedBy;
  const initials = initialsFromName(user.name);
  const avatar = typeof user.image === "string" ? user.image : "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
          >
            <Avatar className="size-8 rounded-lg grayscale">
              {avatar ? <AvatarImage src={avatar} alt={user.name} /> : null}
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-foreground/70">{user.email}</span>
            </div>
            <DotsThreeVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8">
                    {avatar ? <AvatarImage src={avatar} alt={user.name} /> : null}
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to="/solo/account" />}>
                <UserCircleIcon />
                Account
              </DropdownMenuItem>
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
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                void auth.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      void navigate({ to: "/" });
                    },
                  },
                });
              }}
            >
              <SignOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
