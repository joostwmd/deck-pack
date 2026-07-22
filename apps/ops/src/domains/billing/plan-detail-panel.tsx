import { useEffect, useState } from "react";
import { toast } from "sonner";

import { usePlan, useUpdatePlan } from "@deck-pack/hooks/billing";
import type { PlanLimit } from "@deck-pack/hooks/billing";
import {
  PLAN_ASSET_TYPES,
  defaultPlanLimitValues,
  defaultPlanUnlimitedFlags,
  planAssetTypeLabel,
  type PlanAssetType,
} from "@deck-pack/ui/components/billing/asset-types";
import { PlanDetailView } from "@deck-pack/ui/components/billing/plan-detail-view";
import { useBreadcrumbLabel } from "@deck-pack/ui/components/composite/breadcrumb-label-context";

import { useServices } from "@/services/services-context";

function limitsFromPlan(limits: PlanLimit[]): {
  values: Record<PlanAssetType, string>;
  unlimited: Record<PlanAssetType, boolean>;
} {
  const values = defaultPlanLimitValues();
  const unlimited = defaultPlanUnlimitedFlags();
  const byType = new Map(limits.map((limit) => [limit.assetType, limit.insertsPerMonth]));

  for (const assetType of PLAN_ASSET_TYPES) {
    const inserts = byType.get(assetType);
    if (inserts === null) {
      unlimited[assetType] = true;
      values[assetType] = "";
    } else if (typeof inserts === "number") {
      unlimited[assetType] = false;
      values[assetType] = String(inserts);
    }
  }

  return { values, unlimited };
}

export function PlanDetailPanel({ planId }: { planId: string }) {
  const { billing } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [limits, setLimits] = useState(defaultPlanLimitValues);
  const [unlimited, setUnlimited] = useState(defaultPlanUnlimitedFlags);

  const detailQuery = usePlan(billing, planId);

  useBreadcrumbLabel(
    `/plans/${planId}`,
    detailQuery.data?.name ?? (detailQuery.isLoading ? "Loading…" : "Plan"),
  );

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    setName(detailQuery.data.name);
    setSlug(detailQuery.data.slug);
    const next = limitsFromPlan(detailQuery.data.limits);
    setLimits(next.values);
    setUnlimited(next.unlimited);
  }, [detailQuery.data]);

  const updateMutation = useUpdatePlan(billing);

  const dirty = (() => {
    const plan = detailQuery.data;
    if (!plan) return false;
    if (name.trim() !== plan.name || slug.trim() !== plan.slug) return true;

    const baseline = limitsFromPlan(plan.limits);
    for (const assetType of PLAN_ASSET_TYPES) {
      if (unlimited[assetType] !== baseline.unlimited[assetType]) return true;
      if (!unlimited[assetType] && limits[assetType] !== baseline.values[assetType]) {
        return true;
      }
    }
    return false;
  })();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    const parsedLimits: PlanLimit[] = [];
    for (const assetType of PLAN_ASSET_TYPES) {
      if (unlimited[assetType]) {
        parsedLimits.push({ assetType, insertsPerMonth: null });
        continue;
      }
      const inserts = Number.parseInt(limits[assetType], 10);
      if (!Number.isFinite(inserts) || inserts < 0) {
        toast.error(`Enter a valid insert limit for ${planAssetTypeLabel(assetType)}`);
        return;
      }
      parsedLimits.push({ assetType, insertsPerMonth: inserts });
    }

    updateMutation.mutate(
      { planId, name: name.trim(), slug: slug.trim(), limits: parsedLimits },
      {
        onSuccess: () => toast.success("Plan updated"),
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <PlanDetailView
      loading={detailQuery.isLoading}
      errorMessage={detailQuery.isError ? detailQuery.error.message : undefined}
      plan={detailQuery.data}
      name={name}
      onNameChange={setName}
      slug={slug}
      onSlugChange={setSlug}
      limits={limits}
      unlimited={unlimited}
      onLimitChange={(assetType, value) =>
        setLimits((current) => ({ ...current, [assetType]: value }))
      }
      onUnlimitedChange={(assetType, next) =>
        setUnlimited((current) => ({ ...current, [assetType]: next }))
      }
      saving={updateMutation.isPending}
      dirty={dirty}
      onSubmit={handleSubmit}
    />
  );
}
