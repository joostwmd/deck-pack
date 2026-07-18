import { Checkbox } from "@deck-pack/ui/components/system/checkbox";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";

import {
  PLAN_ASSET_TYPES,
  planAssetTypeLabel,
  type PlanAssetType,
} from "@/features/plans/asset-types";

export type PlanFormFieldsProps = {
  name: string;
  onNameChange: (value: string) => void;
  slug: string;
  slugPlaceholder?: string;
  onSlugChange: (value: string) => void;
  limits: Record<PlanAssetType, string>;
  unlimited: Record<PlanAssetType, boolean>;
  onLimitChange: (assetType: PlanAssetType, value: string) => void;
  onUnlimitedChange: (assetType: PlanAssetType, unlimited: boolean) => void;
};

export function PlanFormFields(props: PlanFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plan-name">Name</Label>
          <Input
            id="plan-name"
            value={props.name}
            onChange={(e) => props.onNameChange(e.target.value)}
            placeholder="Pro"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-slug">Slug</Label>
          <Input
            id="plan-slug"
            value={props.slug}
            onChange={(e) => props.onSlugChange(e.target.value)}
            placeholder={props.slugPlaceholder || "pro"}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <Label>Monthly inserts</Label>
          <p className="text-muted-foreground text-xs">0 = none · ∞ = unlimited</p>
        </div>

        <div className="divide-border divide-y rounded-lg border">
          {PLAN_ASSET_TYPES.map((assetType) => {
            const isUnlimited = props.unlimited[assetType];
            const inputId = `plan-limit-${assetType}`;
            const unlimitedId = `plan-unlimited-${assetType}`;

            return (
              <div key={assetType} className="flex items-center gap-3 px-3 py-2.5">
                <Label htmlFor={inputId} className="min-w-28 flex-1 font-normal">
                  {planAssetTypeLabel(assetType)}
                </Label>
                <Input
                  id={inputId}
                  type="number"
                  min={0}
                  step={1}
                  className="h-8 w-24 text-right tabular-nums"
                  value={isUnlimited ? "" : props.limits[assetType]}
                  placeholder="—"
                  disabled={isUnlimited}
                  onChange={(e) => props.onLimitChange(assetType, e.target.value)}
                />
                <label
                  htmlFor={unlimitedId}
                  className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs"
                >
                  <Checkbox
                    id={unlimitedId}
                    checked={isUnlimited}
                    onCheckedChange={(checked) =>
                      props.onUnlimitedChange(assetType, checked === true)
                    }
                  />
                  ∞
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
