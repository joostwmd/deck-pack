export type OpsNavRoute =
  | "/organizations"
  | "/users"
  | "/gallery/shapes"
  | "/gallery/slides"
  | "/gallery/flags"
  | "/plans"
  | "/plans/subscriptions";

export type OpsNavItem = {
  title: string;
  to: OpsNavRoute;
};

export type OpsNavGroup = {
  title: string;
  items: OpsNavItem[];
};

export const OPS_NAV_GROUPS: OpsNavGroup[] = [
  {
    title: "Orgs & users",
    items: [
      { title: "Organizations", to: "/organizations" },
      { title: "Users", to: "/users" },
    ],
  },
  {
    title: "Gallery",
    items: [
      { title: "Shapes", to: "/gallery/shapes" },
      { title: "Slides", to: "/gallery/slides" },
      { title: "Flags", to: "/gallery/flags" },
    ],
  },
  {
    title: "Billing",
    items: [
      { title: "Plans", to: "/plans" },
      { title: "Subscriptions", to: "/plans/subscriptions" },
    ],
  },
];

/** Clickable parent crumbs use known app routes; omit `to` for the current page. */
export type OpsBreadcrumb = {
  label: string;
  to?:
    | "/dashboard"
    | "/organizations"
    | "/users"
    | "/gallery/shapes"
    | "/gallery/slides"
    | "/gallery/flags"
    | "/plans"
    | "/plans/subscriptions";
};

export type OpsBreadcrumbOptions = {
  /** Dynamic labels keyed by path segment / full path, e.g. org detail name. */
  dynamicLabels?: Record<string, string | undefined>;
};

export function opsBreadcrumbs(
  pathname: string,
  options: OpsBreadcrumbOptions = {},
): OpsBreadcrumb[] {
  const { dynamicLabels = {} } = options;

  if (pathname === "/dashboard" || pathname === "/") {
    return [{ label: "Dashboard" }];
  }

  if (pathname === "/organizations") {
    return [{ label: "Organizations" }];
  }

  if (pathname === "/organizations/new") {
    return [
      { label: "Organizations", to: "/organizations" },
      { label: "New" },
    ];
  }

  const orgDetailMatch = pathname.match(/^\/organizations\/([^/]+)$/);
  if (orgDetailMatch) {
    const orgId = orgDetailMatch[1]!;
    const label = dynamicLabels[`/organizations/${orgId}`] ?? dynamicLabels.organization ?? "Organization";
    return [
      { label: "Organizations", to: "/organizations" },
      { label },
    ];
  }

  if (pathname === "/users") {
    return [{ label: "Users" }];
  }

  if (pathname === "/gallery/shapes") {
    return [{ label: "Shapes" }];
  }

  if (pathname === "/gallery/slides") {
    return [{ label: "Slides" }];
  }

  if (pathname === "/gallery/flags") {
    return [{ label: "Flags" }];
  }

  if (pathname === "/plans") {
    return [{ label: "Plans" }];
  }

  if (pathname === "/plans/subscriptions") {
    return [
      { label: "Plans", to: "/plans" },
      { label: "Subscriptions" },
    ];
  }

  return [{ label: "Ops" }];
}

export function isOpsNavItemActive(pathname: string, to: OpsNavRoute): boolean {
  if (to === "/organizations") {
    return pathname === to || pathname.startsWith(`${to}/`);
  }
  if (to === "/plans") {
    return pathname === to;
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}
