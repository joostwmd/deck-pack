import type { Permissions } from "@deck-pack/auth/rbac";
import type { WorkspaceKind } from "@deck-pack/auth/workspace";

export type SoloNavRoute = "/solo/home" | "/solo/account";

export type OrgNavRoute =
  | "/org/dashboard"
  | "/org/members"
  | "/org/seats"
  | "/org/billing"
  | "/org/gallery/shapes"
  | "/org/gallery/flags"
  | "/org/gallery/slides";

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

export const SOLO_NAV_ITEMS: SoloNavItem[] = [{ title: "Home", to: "/solo/home" }];

/** Flat list kept for breadcrumbs / active checks; sidebar uses ORG_NAV_GROUPS. */
export const ORG_NAV_ITEMS: OrgNavItem[] = [
  { title: "Dashboard", to: "/org/dashboard" },
  {
    title: "Shapes",
    to: "/org/gallery/shapes",
    permissions: { gallery: ["create"] },
  },
  {
    title: "Flags",
    to: "/org/gallery/flags",
    permissions: { gallery: ["create"] },
  },
  {
    title: "Slides",
    to: "/org/gallery/slides",
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
  {
    title: "Billing",
    to: "/org/billing",
    permissions: { billing: ["manage"] },
  },
];

export const ORG_NAV_GROUPS: OrgNavGroup[] = [
  {
    title: "Team",
    items: [{ title: "Dashboard", to: "/org/dashboard" }],
  },
  {
    title: "Gallery",
    permissions: { gallery: ["create"] },
    items: [
      { title: "Shapes", to: "/org/gallery/shapes", permissions: { gallery: ["create"] } },
      { title: "Flags", to: "/org/gallery/flags", permissions: { gallery: ["create"] } },
      { title: "Slides", to: "/org/gallery/slides", permissions: { gallery: ["create"] } },
    ],
  },
  {
    title: "Admin",
    items: [
      { title: "Members", to: "/org/members", permissions: { member: ["create"] } },
      { title: "Seats", to: "/org/seats", permissions: { seat: ["view"] } },
      { title: "Billing", to: "/org/billing", permissions: { billing: ["manage"] } },
    ],
  },
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

  if (pathname === "/solo/home" || pathname === "/solo/subscription" || pathname === "/solo") {
    return [{ label: "Home" }];
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

  if (pathname === "/org/billing") {
    return [{ label: "Billing" }];
  }

  if (pathname === "/org/gallery/shapes") {
    return [{ label: "Gallery" }, { label: "Shapes" }];
  }
  if (pathname === "/org/gallery/shapes/new") {
    return [{ label: "Gallery" }, { label: "Shapes", to: "/org/gallery/shapes" }, { label: "New" }];
  }
  const shapeDetail = pathname.match(/^\/org\/gallery\/shapes\/([^/]+)$/);
  if (shapeDetail && shapeDetail[1] !== "new") {
    const label = dynamicLabels[pathname] ?? "Shape";
    return [{ label: "Gallery" }, { label: "Shapes", to: "/org/gallery/shapes" }, { label }];
  }

  if (pathname === "/org/gallery/flags") {
    return [{ label: "Gallery" }, { label: "Flags" }];
  }
  if (pathname === "/org/gallery/flags/new") {
    return [{ label: "Gallery" }, { label: "Flags", to: "/org/gallery/flags" }, { label: "New" }];
  }
  const flagDetail = pathname.match(/^\/org\/gallery\/flags\/([^/]+)$/);
  if (flagDetail && flagDetail[1] !== "new") {
    const label = dynamicLabels[pathname] ?? "Flag";
    return [{ label: "Gallery" }, { label: "Flags", to: "/org/gallery/flags" }, { label }];
  }

  if (pathname === "/org/gallery/slides") {
    return [{ label: "Gallery" }, { label: "Slides" }];
  }
  if (pathname === "/org/gallery/slides/new") {
    return [{ label: "Gallery" }, { label: "Slides", to: "/org/gallery/slides" }, { label: "New" }];
  }
  const slideDetail = pathname.match(/^\/org\/gallery\/slides\/([^/]+)$/);
  if (slideDetail && slideDetail[1] !== "new") {
    const label = dynamicLabels[pathname] ?? "Slide";
    return [{ label: "Gallery" }, { label: "Slides", to: "/org/gallery/slides" }, { label }];
  }

  if (pathname.startsWith("/org/gallery")) {
    return [{ label: "Gallery" }];
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
  if (to === "/solo/home") {
    return pathname === to || pathname === "/solo" || pathname === "/solo/subscription";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function portalHomePath(workspace: WorkspaceKind | null | undefined): PortalNavRoute {
  return workspace === "team" ? "/org/dashboard" : "/solo/home";
}

export function workspaceFromSession(
  session: { workspace?: string | null } | null | undefined,
): WorkspaceKind | null {
  if (session?.workspace === "solo" || session?.workspace === "team") {
    return session.workspace;
  }
  return null;
}
