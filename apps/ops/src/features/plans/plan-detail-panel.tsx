import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useBreadcrumbLabel } from "@/components/breadcrumb-label-context";
import {
  PLAN_ASSET_TYPES,
  defaultPlanLimitValues,
  defaultPlanUnlimitedFlags,
  planAssetTypeLabel,
  type PlanAssetType,
} from "@/features/plans/asset-types";
import { PlanDetailView } from "@/features/plans/plan-detail-view";
import { useServices } from "@/services/services-context";
import type { PlanLimit } from "@/services/types";

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
  const queryClient = useQueryClient();
  const { billing } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [limits, setLimits] = useState(defaultPlanLimitValues);
  const [unlimited, setUnlimited] = useState(defaultPlanUnlimitedFlags);

  const detailQuery = useQuery({
    queryKey: ["billing", "plan", planId],
    queryFn: () => billing.getPlan(planId),
  });

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

  const updateMutation = useMutation({
    mutationFn: (input: { name: string; slug: string; limits: PlanLimit[] }) =>
      billing.updatePlan({ planId, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing", "plan", planId] });
      void queryClient.invalidateQueries({ queryKey: ["billing", "plans"] });
      toast.success("Plan updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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

    updateMutation.mutate({
      name: name.trim(),
      slug: slug.trim(),
      limits: parsedLimits,
    });
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
