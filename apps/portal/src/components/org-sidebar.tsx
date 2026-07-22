import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@deck-pack/ui/components/system/sidebar";
import { SquaresFour } from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  ORG_NAV_GROUPS,
  isPortalNavItemActive,
  type OrgNavGroup,
  type OrgNavItem,
} from "@/config/portal-nav";
import { useCan } from "@/auth/use-can";
import { getAuthClient } from "@/utils/auth";

import { SidebarUserMenu } from "./sidebar-user-menu";

function filterGroupItems(
  group: OrgNavGroup,
  can: (permissions: NonNullable<OrgNavItem["permissions"]>) => boolean,
  isLoading: boolean,
): OrgNavItem[] {
  if (group.permissions) {
    if (isLoading || !can(group.permissions)) {
      return [];
    }
  }

  return group.items.filter((item) => {
    if (!item.permissions) {
      return true;
    }
    if (isLoading) {
      return false;
    }
    return can(item.permissions);
  });
}

export function OrgSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { can, isLoading } = useCan();
  const { data: activeOrganization } = getAuthClient().useActiveOrganization();

  const visibleGroups = ORG_NAV_GROUPS.map((group) => ({
    ...group,
    items: filterGroupItems(group, can, isLoading),
  })).filter((group) => group.items.length > 0);

  const orgName = activeOrganization?.name?.trim() || "Team";

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/org/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <SquaresFour className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">{orgName}</span>
                <span className="text-muted-foreground text-xs">Team workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {visibleGroups.map((group) => (
              <SidebarMenuItem key={group.title}>
                <SidebarMenuButton className="pointer-events-none font-medium">
                  {group.title}
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {group.items.map((item) => (
                    <SidebarMenuSubItem key={item.to}>
                      <SidebarMenuSubButton
                        render={<Link to={item.to} />}
                        isActive={isPortalNavItemActive(pathname, item.to)}
                      >
                        <span>{item.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
