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
    | "/gallery/shapes/new"
    | "/gallery/slides"
    | "/gallery/slides/new"
    | "/gallery/flags"
    | "/gallery/flags/new"
    | "/plans"
    | "/plans/subscriptions"
    | "/plans/new"
    | "/plans/subscriptions/new";
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

  if (pathname === "/gallery/shapes/new") {
    return [
      { label: "Shapes", to: "/gallery/shapes" },
      { label: "New" },
    ];
  }

  const shapeDetailMatch = pathname.match(/^\/gallery\/shapes\/([^/]+)$/);
  if (shapeDetailMatch && shapeDetailMatch[1] !== "new") {
    const itemId = shapeDetailMatch[1]!;
    const label = dynamicLabels[`/gallery/shapes/${itemId}`] ?? "Shape";
    return [
      { label: "Shapes", to: "/gallery/shapes" },
      { label },
    ];
  }

  if (pathname === "/gallery/slides") {
    return [{ label: "Slides" }];
  }

  if (pathname === "/gallery/slides/new") {
    return [
      { label: "Slides", to: "/gallery/slides" },
      { label: "New" },
    ];
  }

  const slideDetailMatch = pathname.match(/^\/gallery\/slides\/([^/]+)$/);
  if (slideDetailMatch && slideDetailMatch[1] !== "new") {
    const itemId = slideDetailMatch[1]!;
    const label = dynamicLabels[`/gallery/slides/${itemId}`] ?? "Slide";
    return [
      { label: "Slides", to: "/gallery/slides" },
      { label },
    ];
  }

  if (pathname === "/gallery/flags") {
    return [{ label: "Flags" }];
  }

  if (pathname === "/gallery/flags/new") {
    return [
      { label: "Flags", to: "/gallery/flags" },
      { label: "New" },
    ];
  }

  const flagDetailMatch = pathname.match(/^\/gallery\/flags\/([^/]+)$/);
  if (flagDetailMatch && flagDetailMatch[1] !== "new") {
    const itemId = flagDetailMatch[1]!;
    const label = dynamicLabels[`/gallery/flags/${itemId}`] ?? "Flag";
    return [
      { label: "Flags", to: "/gallery/flags" },
      { label },
    ];
  }

  if (pathname === "/plans") {
    return [{ label: "Plans" }];
  }

  if (pathname === "/plans/new") {
    return [
      { label: "Plans", to: "/plans" },
      { label: "New" },
    ];
  }

  const planDetailMatch = pathname.match(/^\/plans\/([^/]+)$/);
  if (planDetailMatch && planDetailMatch[1] !== "new" && planDetailMatch[1] !== "subscriptions") {
    const planId = planDetailMatch[1]!;
    const label = dynamicLabels[`/plans/${planId}`] ?? "Plan";
    return [
      { label: "Plans", to: "/plans" },
      { label },
    ];
  }

  if (pathname === "/plans/subscriptions") {
    return [
      { label: "Plans", to: "/plans" },
      { label: "Subscriptions" },
    ];
  }

  if (pathname === "/plans/subscriptions/new") {
    return [
      { label: "Plans", to: "/plans" },
      { label: "Subscriptions", to: "/plans/subscriptions" },
      { label: "New" },
    ];
  }

  const subscriptionDetailMatch = pathname.match(/^\/plans\/subscriptions\/([^/]+)$/);
  if (subscriptionDetailMatch && subscriptionDetailMatch[1] !== "new") {
    const subscriptionId = subscriptionDetailMatch[1]!;
    const label =
      dynamicLabels[`/plans/subscriptions/${subscriptionId}`] ?? "Subscription";
    return [
      { label: "Plans", to: "/plans" },
      { label: "Subscriptions", to: "/plans/subscriptions" },
      { label },
    ];
  }

  return [{ label: "Ops" }];
}

export function isOpsNavItemActive(pathname: string, to: OpsNavRoute): boolean {
  if (to === "/organizations") {
    return pathname === to || pathname.startsWith(`${to}/`);
  }
  if (to === "/plans") {
    return (
      pathname === to ||
      pathname === "/plans/new" ||
      (/^\/plans\/[^/]+$/.test(pathname) && !pathname.startsWith("/plans/subscriptions"))
    );
  }
  if (to === "/plans/subscriptions") {
    return pathname === to || pathname.startsWith(`${to}/`);
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}
