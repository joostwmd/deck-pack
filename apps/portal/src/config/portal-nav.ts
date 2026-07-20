import type { Permissions } from "@deck-pack/auth/rbac";
import type { WorkspaceKind } from "@deck-pack/auth/workspace";

export type SoloNavRoute = "/solo/subscription" | "/solo/account";

export type OrgNavRoute =
  | "/org/dashboard"
  | "/org/members"
  | "/org/seats"
  | "/org/library/shapes"
  | "/org/library/flags"
  | "/org/library/slides";

export type PortalNavRoute = SoloNavRoute | OrgNavRoute;

export type SoloNavItem = {
  title: string;
  to: SoloNavRoute;
};

export type OrgNavItem = {
  title: string;
  to: OrgNavRoute;
  permissions?: Permissions;
};

export const SOLO_NAV_ITEMS: SoloNavItem[] = [
  { title: "Subscription", to: "/solo/subscription" },
];

export const ORG_NAV_ITEMS: OrgNavItem[] = [
  { title: "Dashboard", to: "/org/dashboard" },
  {
    title: "Library",
    to: "/org/library/shapes",
    permissions: { library: ["create"] },
  },
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
export const ORG_SECONDARY_NAV_ITEMS: SoloNavItem[] = [
  { title: "Personal account", to: "/solo/account" },
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

  if (pathname === "/solo/subscription") {
    return [{ label: "Subscription" }];
  }

  if (pathname === "/solo/account" || pathname === "/account") {
    return [{ label: "Account" }];
  }

  if (pathname === "/org/dashboard" || pathname === "/org") {
    return [{ label: "Dashboard" }];
  }

  if (pathname === "/org/members") {
    return [{ label: "Members" }];
  }

  if (pathname.startsWith("/org/library")) {
    return [{ label: "Library" }];
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
  if (to === "/solo/subscription") {
    return pathname === to || pathname === "/solo";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function portalHomePath(workspace: WorkspaceKind | null | undefined): PortalNavRoute {
  return workspace === "team" ? "/org/dashboard" : "/solo/subscription";
}

export function workspaceFromSession(
  session: { workspace?: string | null } | null | undefined,
): WorkspaceKind | null {
  if (session?.workspace === "solo" || session?.workspace === "team") {
    return session.workspace;
  }
  return null;
}
