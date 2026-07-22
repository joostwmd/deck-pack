import { Button } from "@deck-pack/ui/components/system/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@deck-pack/ui/components/system/table";
import { Link } from "@tanstack/react-router";

import {
  PLAN_ASSET_TYPES,
  formatInsertLimit,
  planAssetTypeLabel,
  planAssetTypeShortLabel,
  type PlanAssetType,
} from "./asset-types";
import type { Plan, PlanLimit } from "./types";

export type PlansListViewProps = {
  loading: boolean;
  errorMessage?: string;
  plans: Plan[];
};

function limitForAsset(limits: PlanLimit[], assetType: PlanAssetType): number | null | undefined {
  const match = limits.find((limit) => limit.assetType === assetType);
  return match?.insertsPerMonth;
}

function formatCreatedAt(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PlansListView({ loading, errorMessage, plans }: PlansListViewProps) {
  const colCount = 3 + PLAN_ASSET_TYPES.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Plans</h1>
          <p className="text-muted-foreground text-sm">
            Subscription tiers and monthly insert limits per asset class. ∞ = unlimited.
          </p>
        </div>
        <Button render={<Link to="/plans/new" />}>New plan</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading plans…</p>
      ) : errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[120px]">Name</TableHead>
                <TableHead className="min-w-[100px]">Slug</TableHead>
                {PLAN_ASSET_TYPES.map((assetType) => (
                  <TableHead
                    key={assetType}
                    className="min-w-[72px] text-right"
                    title={`${planAssetTypeLabel(assetType)} inserts / month`}
                  >
                    {planAssetTypeShortLabel(assetType)}
                  </TableHead>
                ))}
                <TableHead className="min-w-[100px]">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colCount} className="text-muted-foreground h-28 text-center">
                    No plans yet. Create one to assign to organizations.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/plans/$planId"
                        params={{ planId: plan.id }}
                        className="hover:underline"
                      >
                        {plan.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {plan.slug}
                    </TableCell>
                    {PLAN_ASSET_TYPES.map((assetType) => {
                      const value = limitForAsset(plan.limits, assetType);
                      const isUnlimited = value === null || value === undefined;
                      return (
                        <TableCell key={assetType} className="text-right text-sm tabular-nums">
                          {isUnlimited && value === undefined ? (
                            <span className="text-muted-foreground">—</span>
                          ) : isUnlimited ? (
                            <span className="text-muted-foreground" title="Unlimited">
                              ∞
                            </span>
                          ) : (
                            formatInsertLimit(value)
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {formatCreatedAt(plan.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
