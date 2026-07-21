import { Badge } from "@deck-pack/ui/components/system/badge";
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

import type { OrganizationSubscription } from "./types";

export type SubscriptionsListViewProps = {
  loading: boolean;
  errorMessage?: string;
  subscriptions: OrganizationSubscription[];
};

export function SubscriptionsListView({
  loading,
  errorMessage,
  subscriptions,
}: SubscriptionsListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground text-sm">
            Organization plan entitlements — quantity is the seat count
          </p>
        </div>
        <Button render={<Link to="/plans/subscriptions/new" />}>New subscription</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="w-[100px]">Seats</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                    No organization subscriptions yet.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Link
                        to="/plans/subscriptions/$subscriptionId"
                        params={{ subscriptionId: sub.id }}
                        className="hover:underline"
                      >
                        <div className="font-medium">{sub.organizationName}</div>
                        <div className="text-muted-foreground text-xs">{sub.organizationSlug}</div>
                      </Link>
                    </TableCell>
                    <TableCell>{sub.planName}</TableCell>
                    <TableCell className="tabular-nums">{sub.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                        {sub.status}
                      </Badge>
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
