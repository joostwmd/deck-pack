import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@deck-pack/ui/components/system/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { Buildings, Books, Chair, UserCircle, Users } from "@phosphor-icons/react";

import {
  ORG_NAV_ITEMS,
  ORG_SECONDARY_NAV_ITEMS,
  isPortalNavItemActive,
  type OrgNavItem,
  type PortalNavRoute,
} from "@/config/portal-nav";
import { useCan } from "@/auth/use-can";
import type { Icon } from "@phosphor-icons/react";

const NAV_ICONS: Partial<Record<PortalNavRoute, Icon>> = {
  "/org/dashboard": Buildings,
  "/org/library/shapes": Books,
  "/org/library/flags": Books,
  "/org/library/slides": Books,
  "/org/members": Users,
  "/org/seats": Chair,
  "/solo/account": UserCircle,
};

export function OrgSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { can, isLoading } = useCan();

  const visibleOrgNavItems = ORG_NAV_ITEMS.filter((item: OrgNavItem) => {
    if (!item.permissions) {
      return true;
    }
    if (isLoading) {
      return false;
    }
    return can(item.permissions);
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-3 text-sm font-semibold">Team workspace</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleOrgNavItems.map((item) => {
                const Icon = NAV_ICONS[item.to] ?? Buildings;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={isPortalNavItemActive(pathname, item.to)}
                      render={<Link to={item.to} />}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-2" />
        <SidebarGroup>
          <SidebarGroupLabel>Also</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ORG_SECONDARY_NAV_ITEMS.map((item) => {
                const Icon = NAV_ICONS[item.to] ?? UserCircle;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={isPortalNavItemActive(pathname, item.to)}
                      render={<Link to={item.to} />}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 text-xs text-muted-foreground">Team workspace</SidebarFooter>
    </Sidebar>
  );
}
