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

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/organizations": "Organizations",
  "/organizations/new": "New organization",
  "/users": "Users",
  "/gallery/shapes": "Shapes",
  "/gallery/slides": "Slides",
  "/gallery/flags": "Flags",
  "/plans": "Plans",
  "/plans/subscriptions": "Subscriptions",
};

export function opsPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) {
    return PAGE_LABELS[pathname];
  }
  if (pathname.startsWith("/organizations/")) {
    return "Organizations";
  }
  if (pathname.startsWith("/gallery/")) {
    return "Gallery";
  }
  if (pathname.startsWith("/plans/")) {
    return "Billing";
  }
  return "Ops";
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
