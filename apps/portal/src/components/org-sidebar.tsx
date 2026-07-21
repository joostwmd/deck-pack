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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@deck-pack/ui/components/system/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  ORG_NAV_GROUPS,
  ORG_SECONDARY_NAV_ITEMS,
  isPortalNavItemActive,
  type OrgNavGroup,
  type OrgNavItem,
} from "@/config/portal-nav";
import { useCan } from "@/auth/use-can";

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

  const visibleGroups = ORG_NAV_GROUPS.map((group) => ({
    ...group,
    items: filterGroupItems(group, can, isLoading),
  })).filter((group) => group.items.length > 0);

  return (
    <Sidebar>
      <SidebarHeader className="p-3 text-sm font-semibold">Team workspace</SidebarHeader>
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
        <SidebarSeparator className="mx-2" />
        <SidebarGroup>
          <SidebarGroupLabel>Also</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ORG_SECONDARY_NAV_ITEMS.map((item) => (
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
      <SidebarFooter className="p-2 text-xs text-muted-foreground">Team workspace</SidebarFooter>
    </Sidebar>
  );
}
