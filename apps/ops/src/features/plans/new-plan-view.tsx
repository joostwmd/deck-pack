import { Button } from "@deck-pack/ui/components/system/button";
import { Card, CardContent } from "@deck-pack/ui/components/system/card";
import { Link } from "@tanstack/react-router";

import { PlanFormFields } from "@/features/plans/plan-form-fields";
import type { PlanAssetType } from "@/features/plans/asset-types";

export type NewPlanViewProps = {
  name: string;
  onNameChange: (value: string) => void;
  effectiveSlug: string;
  derivedSlug: string;
  onSlugChange: (value: string) => void;
  limits: Record<PlanAssetType, string>;
  unlimited: Record<PlanAssetType, boolean>;
  onLimitChange: (assetType: PlanAssetType, value: string) => void;
  onUnlimitedChange: (assetType: PlanAssetType, unlimited: boolean) => void;
  submitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
};

export function NewPlanView(props: NewPlanViewProps) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">New plan</h1>
        <p className="text-muted-foreground text-sm">
          Name the tier, then set monthly insert limits per asset class.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={props.onSubmit} className="space-y-6">
            <PlanFormFields
              name={props.name}
              onNameChange={props.onNameChange}
              slug={props.effectiveSlug}
              slugPlaceholder={props.derivedSlug || "pro"}
              onSlugChange={props.onSlugChange}
              limits={props.limits}
              unlimited={props.unlimited}
              onLimitChange={props.onLimitChange}
              onUnlimitedChange={props.onUnlimitedChange}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={props.submitting}>
                {props.submitting ? "Creating…" : "Create plan"}
              </Button>
              <Button type="button" variant="outline" render={<Link to="/plans" />}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
