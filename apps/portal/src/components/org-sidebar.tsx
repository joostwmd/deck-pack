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
import { Buildings, UserCircle, Users } from "@phosphor-icons/react";

import {
  ORG_NAV_ITEMS,
  ORG_SECONDARY_NAV_ITEMS,
  isPortalNavItemActive,
  type PortalNavRoute,
} from "@/config/portal-nav";
import type { Icon } from "@phosphor-icons/react";

const NAV_ICONS: Record<PortalNavRoute, Icon> = {
  "/org/dashboard": Buildings,
  "/org/members": Users,
  "/account": UserCircle,
};

export function OrgSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar>
      <SidebarHeader className="p-3 text-sm font-semibold">Organization</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ORG_NAV_ITEMS.map((item) => {
                const Icon = NAV_ICONS[item.to];
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
                const Icon = NAV_ICONS[item.to];
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
      <SidebarFooter className="p-2 text-xs text-muted-foreground">Org workspace</SidebarFooter>
    </Sidebar>
  );
}
