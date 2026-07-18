import { Badge } from "@deck-pack/ui/components/system/badge";
import { Button } from "@deck-pack/ui/components/system/button";
import { Card, CardContent } from "@deck-pack/ui/components/system/card";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";

import type { OrganizationSubscription, Plan } from "@/services/types";

export type SubscriptionDetailViewProps = {
  loading: boolean;
  errorMessage?: string;
  subscription?: OrganizationSubscription;
  plans: Plan[];
  plansLoading: boolean;
  planId: string;
  onPlanIdChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  status: "active" | "canceled";
  onStatusChange: (value: "active" | "canceled") => void;
  saving: boolean;
  dirty: boolean;
  onSubmit: (event: React.FormEvent) => void;
};

export function SubscriptionDetailView(props: SubscriptionDetailViewProps) {
  if (props.loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (props.errorMessage || !props.subscription) {
    return (
      <p className="text-destructive text-sm">
        {props.errorMessage ?? "Subscription not found"}
      </p>
    );
  }

  const sub = props.subscription;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{sub.organizationName}</h1>
          <Badge variant={sub.status === "active" ? "default" : "secondary"}>
            {sub.status}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {sub.organizationSlug} · currently on {sub.planName}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={props.onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub-plan">Plan</Label>
              <Select
                value={props.planId || undefined}
                onValueChange={(value) => {
                  if (value) props.onPlanIdChange(value);
                }}
                disabled={props.plansLoading || props.plans.length === 0}
              >
                <SelectTrigger id="sub-plan" className="w-full">
                  <SelectValue placeholder="Select plan…" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {props.plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-quantity">Seats</Label>
              <Input
                id="sub-quantity"
                type="number"
                min={1}
                step={1}
                value={props.quantity}
                onChange={(e) => props.onQuantityChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-status">Status</Label>
              <Select
                value={props.status}
                onValueChange={(value) => {
                  if (value === "active" || value === "canceled") {
                    props.onStatusChange(value);
                  }
                }}
              >
                <SelectTrigger id="sub-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={props.saving || !props.dirty}>
              {props.saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
