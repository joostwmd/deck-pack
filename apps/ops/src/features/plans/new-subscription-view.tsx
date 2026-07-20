import { Button } from "@deck-pack/ui/components/system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@deck-pack/ui/components/system/card";
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
import { Link } from "@tanstack/react-router";

export type NewSubscriptionViewProps = {
  organizations: Array<{ id: string; name: string; slug: string }>;
  plans: Array<{ id: string; name: string; slug: string }>;
  organizationId: string;
  onOrganizationIdChange: (value: string) => void;
  planId: string;
  onPlanIdChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  loadingOptions: boolean;
  optionsError?: string;
  submitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
};

export function NewSubscriptionView(props: NewSubscriptionViewProps) {
  const noOrgs = !props.loadingOptions && props.organizations.length === 0;
  const noPlans = !props.loadingOptions && props.plans.length === 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">New subscription</h1>
        <p className="text-muted-foreground text-sm">
          Assign one plan to an organization. Quantity is the purchased seat count.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entitlement</CardTitle>
          <CardDescription>
            Each organization can have only one active subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {props.loadingOptions ? (
            <p className="text-muted-foreground text-sm">Loading options…</p>
          ) : props.optionsError ? (
            <p className="text-destructive text-sm">{props.optionsError}</p>
          ) : (
            <form onSubmit={props.onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sub-org">Organization</Label>
                <Select
                  value={props.organizationId || undefined}
                  onValueChange={(value) => {
                    if (value) props.onOrganizationIdChange(value);
                  }}
                  disabled={noOrgs}
                >
                  <SelectTrigger id="sub-org" className="w-full">
                    <SelectValue placeholder="Select organization…" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {props.organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {`${org.name} (${org.slug})`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {noOrgs ? (
                  <p className="text-muted-foreground text-xs">
                    Create an organization first.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub-plan">Plan</Label>
                <Select
                  value={props.planId || undefined}
                  onValueChange={(value) => {
                    if (value) props.onPlanIdChange(value);
                  }}
                  disabled={noPlans}
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
                {noPlans ? (
                  <p className="text-muted-foreground text-xs">Create a plan first.</p>
                ) : null}
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
                  placeholder="10"
                />
                <p className="text-muted-foreground text-xs">
                  How many times this plan is licensed to the org (seat count).
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={props.submitting || noOrgs || noPlans}
                >
                  {props.submitting ? "Creating…" : "Create subscription"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  render={<Link to="/plans/subscriptions" />}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
