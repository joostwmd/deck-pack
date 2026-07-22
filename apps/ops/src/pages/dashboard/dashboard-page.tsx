import { Link } from "@tanstack/react-router";
import {
  Buildings,
  CreditCard,
  Flag,
  PresentationChart,
  Receipt,
  Shapes,
  Users,
} from "@phosphor-icons/react";

import { OpsPageShell } from "@/components/ops-page-shell";

const SECTIONS = [
  {
    title: "Organizations",
    description: "Manage customer orgs and owners",
    to: "/organizations",
    icon: Buildings,
  },
  {
    title: "Users",
    description: "Search and manage platform users",
    to: "/users",
    icon: Users,
  },
  {
    title: "Shapes",
    description: "Global shape library",
    to: "/gallery/shapes",
    icon: Shapes,
  },
  {
    title: "Slides",
    description: "Global slide templates",
    to: "/gallery/slides",
    icon: PresentationChart,
  },
  {
    title: "Flags",
    description: "Country and region flags",
    to: "/gallery/flags",
    icon: Flag,
  },
  {
    title: "Plans",
    description: "Subscription tiers and insert limits",
    to: "/plans",
    icon: CreditCard,
  },
  {
    title: "Subscriptions",
    description: "Org plan entitlements and seat counts",
    to: "/plans/subscriptions",
    icon: Receipt,
  },
] as const;

export function DashboardPage() {
  return (
    <OpsPageShell title="Dashboard" description="Overview of platform administration areas">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map(({ title, description, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground text-sm">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </OpsPageShell>
  );
}
