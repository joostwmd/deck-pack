import { Button } from "@deck-pack/ui/components/system/button";
import { Card, CardContent } from "@deck-pack/ui/components/system/card";

import type { PlanAssetType } from "./asset-types";
import { PlanFormFields } from "./plan-form-fields";
import type { Plan } from "./types";

export type PlanDetailViewProps = {
  loading: boolean;
  errorMessage?: string;
  plan?: Plan;
  name: string;
  onNameChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  limits: Record<PlanAssetType, string>;
  unlimited: Record<PlanAssetType, boolean>;
  onLimitChange: (assetType: PlanAssetType, value: string) => void;
  onUnlimitedChange: (assetType: PlanAssetType, unlimited: boolean) => void;
  saving: boolean;
  dirty: boolean;
  onSubmit: (event: React.FormEvent) => void;
};

export function PlanDetailView(props: PlanDetailViewProps) {
  if (props.loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (props.errorMessage || !props.plan) {
    return <p className="text-destructive text-sm">{props.errorMessage ?? "Plan not found"}</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{props.plan.name}</h1>
        <p className="text-muted-foreground font-mono text-sm">{props.plan.slug}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={props.onSubmit} className="space-y-6">
            <PlanFormFields
              name={props.name}
              onNameChange={props.onNameChange}
              slug={props.slug}
              onSlugChange={props.onSlugChange}
              limits={props.limits}
              unlimited={props.unlimited}
              onLimitChange={props.onLimitChange}
              onUnlimitedChange={props.onUnlimitedChange}
            />

            <Button type="submit" disabled={props.saving || !props.dirty}>
              {props.saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
