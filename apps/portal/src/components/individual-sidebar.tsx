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
import { UserCircle } from "@phosphor-icons/react";

import { INDIVIDUAL_NAV_ITEMS, isPortalNavItemActive, type IndividualNavRoute } from "@/config/portal-nav";

const NAV_ICONS: Record<IndividualNavRoute, typeof UserCircle> = {
  "/account": UserCircle,
};

export function IndividualSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar>
      <SidebarHeader className="p-3 text-sm font-semibold">Personal</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {INDIVIDUAL_NAV_ITEMS.map((item) => {
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
    </Sidebar>
  );
}
