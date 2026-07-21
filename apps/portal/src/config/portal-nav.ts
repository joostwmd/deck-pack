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

export type OrgNavGroup = {
  title: string;
  permissions?: Permissions;
  items: OrgNavItem[];
};

export const SOLO_NAV_ITEMS: SoloNavItem[] = [{ title: "Subscription", to: "/solo/subscription" }];

/** Flat list kept for breadcrumbs / active checks; sidebar uses ORG_NAV_GROUPS. */
export const ORG_NAV_ITEMS: OrgNavItem[] = [
  { title: "Dashboard", to: "/org/dashboard" },
  {
    title: "Shapes",
    to: "/org/library/shapes",
    permissions: { gallery: ["create"] },
  },
  {
    title: "Flags",
    to: "/org/library/flags",
    permissions: { gallery: ["create"] },
  },
  {
    title: "Slides",
    to: "/org/library/slides",
    permissions: { gallery: ["create"] },
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

export const ORG_NAV_GROUPS: OrgNavGroup[] = [
  {
    title: "Team",
    items: [{ title: "Dashboard", to: "/org/dashboard" }],
  },
  {
    title: "Library",
    permissions: { gallery: ["create"] },
    items: [
      { title: "Shapes", to: "/org/library/shapes", permissions: { gallery: ["create"] } },
      { title: "Flags", to: "/org/library/flags", permissions: { gallery: ["create"] } },
      { title: "Slides", to: "/org/library/slides", permissions: { gallery: ["create"] } },
    ],
  },
  {
    title: "Admin",
    items: [
      { title: "Members", to: "/org/members", permissions: { member: ["create"] } },
      { title: "Seats", to: "/org/seats", permissions: { seat: ["view"] } },
    ],
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

  if (pathname === "/org/seats") {
    return [{ label: "Seats" }];
  }

  if (pathname === "/org/library/shapes") {
    return [{ label: "Library" }, { label: "Shapes" }];
  }
  if (pathname === "/org/library/shapes/new") {
    return [{ label: "Library" }, { label: "Shapes", to: "/org/library/shapes" }, { label: "New" }];
  }
  const shapeDetail = pathname.match(/^\/org\/library\/shapes\/([^/]+)$/);
  if (shapeDetail && shapeDetail[1] !== "new") {
    const label = dynamicLabels[pathname] ?? "Shape";
    return [{ label: "Library" }, { label: "Shapes", to: "/org/library/shapes" }, { label }];
  }

  if (pathname === "/org/library/flags") {
    return [{ label: "Library" }, { label: "Flags" }];
  }
  if (pathname === "/org/library/flags/new") {
    return [{ label: "Library" }, { label: "Flags", to: "/org/library/flags" }, { label: "New" }];
  }
  const flagDetail = pathname.match(/^\/org\/library\/flags\/([^/]+)$/);
  if (flagDetail && flagDetail[1] !== "new") {
    const label = dynamicLabels[pathname] ?? "Flag";
    return [{ label: "Library" }, { label: "Flags", to: "/org/library/flags" }, { label }];
  }

  if (pathname === "/org/library/slides") {
    return [{ label: "Library" }, { label: "Slides" }];
  }
  if (pathname === "/org/library/slides/new") {
    return [{ label: "Library" }, { label: "Slides", to: "/org/library/slides" }, { label: "New" }];
  }
  const slideDetail = pathname.match(/^\/org\/library\/slides\/([^/]+)$/);
  if (slideDetail && slideDetail[1] !== "new") {
    const label = dynamicLabels[pathname] ?? "Slide";
    return [{ label: "Library" }, { label: "Slides", to: "/org/library/slides" }, { label }];
  }

  if (pathname.startsWith("/org/library")) {
    return [{ label: "Library" }];
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
