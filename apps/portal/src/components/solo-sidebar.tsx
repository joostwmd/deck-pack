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
import { CreditCard, UserCircle } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import {
  SOLO_NAV_ITEMS,
  isPortalNavItemActive,
  type SoloNavRoute,
} from "@/config/portal-nav";

const NAV_ICONS: Record<SoloNavRoute, Icon> = {
  "/solo/subscription": CreditCard,
  "/solo/account": UserCircle,
};

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
              {SOLO_NAV_ITEMS.map((item) => {
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
