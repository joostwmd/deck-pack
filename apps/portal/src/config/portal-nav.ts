import type { Permissions } from "@deck-pack/auth/rbac";

export type IndividualNavRoute = "/account";

export type OrgNavRoute = "/org/dashboard" | "/org/members" | "/org/seats";

export type PortalNavRoute = IndividualNavRoute | OrgNavRoute;

export type PortalNavItem = {
  title: string;
  to: PortalNavRoute;
  permissions?: Permissions;
};

export type IndividualNavItem = {
  title: string;
  to: IndividualNavRoute;
};

export type OrgNavItem = {
  title: string;
  to: OrgNavRoute;
  permissions?: Permissions;
};

export const INDIVIDUAL_NAV_ITEMS: IndividualNavItem[] = [{ title: "Account", to: "/account" }];

export const ORG_NAV_ITEMS: OrgNavItem[] = [
  { title: "Dashboard", to: "/org/dashboard" },
  {
    title: "Members",
    to: "/org/members",
    permissions: { member: ["create"] },
  },
  {
    title: "Seats",
    to: "/org/seats",
    permissions: { seat: ["view"] },
  },
];

/** Cross-workspace link shown in the org sidebar. */
export const ORG_SECONDARY_NAV_ITEMS: IndividualNavItem[] = [
  { title: "Personal account", to: "/account" },
];

export type PortalBreadcrumb = {
  label: string;
  to?: PortalNavRoute;
};

export type PortalBreadcrumbOptions = {
  dynamicLabels?: Record<string, string | undefined>;
};

export function portalBreadcrumbs(
  pathname: string,
  options: PortalBreadcrumbOptions = {},
): PortalBreadcrumb[] {
  const { dynamicLabels = {} } = options;

  if (pathname === "/account") {
    return [{ label: "Account" }];
  }

  if (pathname === "/org/dashboard" || pathname === "/org") {
    return [{ label: "Dashboard" }];
  }

  if (pathname === "/org/members") {
    return [{ label: "Members" }];
  }

  if (pathname === "/org/seats") {
    return [{ label: "Seats" }];
  }

  const dynamicLabel = dynamicLabels[pathname];
  if (dynamicLabel) {
    return [{ label: dynamicLabel }];
  }

  return [{ label: "Portal" }];
}

export function isPortalNavItemActive(pathname: string, to: PortalNavRoute): boolean {
  if (to === "/org/dashboard") {
    return pathname === to || pathname === "/org";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function portalHomePath(activeOrganizationId: string | null | undefined): PortalNavRoute {
  return activeOrganizationId ? "/org/dashboard" : "/account";
}
