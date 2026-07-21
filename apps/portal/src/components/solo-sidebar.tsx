import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@deck-pack/ui/components/system/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";

import { SOLO_NAV_ITEMS, isPortalNavItemActive } from "@/config/portal-nav";

export function SoloSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar>
      <SidebarHeader className="p-3 text-sm font-semibold">Solo workspace</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Billing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SOLO_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={isPortalNavItemActive(pathname, item.to)}
                    render={<Link to={item.to} />}
                  >
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
