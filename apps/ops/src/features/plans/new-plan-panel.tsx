import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  PLAN_ASSET_TYPES,
  defaultPlanLimitValues,
  defaultPlanUnlimitedFlags,
  planAssetTypeLabel,
  type PlanAssetType,
} from "@/features/plans/asset-types";
import { NewPlanView } from "@/features/plans/new-plan-view";
import { slugifyName } from "@/features/organizations/slugify";
import { useServices } from "@/services/services-context";
import type { PlanLimit } from "@/services/types";

export function NewPlanPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { billing } = useServices();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [limits, setLimits] = useState(defaultPlanLimitValues);
  const [unlimited, setUnlimited] = useState(defaultPlanUnlimitedFlags);

  const derivedSlug = useMemo(() => slugifyName(name), [name]);
  const effectiveSlug = slugTouched ? slug : derivedSlug;

  const createMutation = useMutation({
    mutationFn: (input: { name: string; slug: string; limits: PlanLimit[] }) =>
      billing.createPlan(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing", "plans"] });
      toast.success("Plan created");
      void navigate({ to: "/plans" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleLimitChange = (assetType: PlanAssetType, value: string) => {
    setLimits((current) => ({ ...current, [assetType]: value }));
  };

  const handleUnlimitedChange = (assetType: PlanAssetType, next: boolean) => {
    setUnlimited((current) => ({ ...current, [assetType]: next }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = effectiveSlug;
    if (!name.trim() || !s) {
      toast.error("Fill in name and slug");
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

    createMutation.mutate({
      name: name.trim(),
      slug: s,
      limits: parsedLimits,
    });
  };

  return (
    <NewPlanView
      name={name}
      onNameChange={setName}
      effectiveSlug={effectiveSlug}
      derivedSlug={derivedSlug}
      onSlugChange={(value) => {
        setSlugTouched(true);
        setSlug(value);
      }}
      limits={limits}
      unlimited={unlimited}
      onLimitChange={handleLimitChange}
      onUnlimitedChange={handleUnlimitedChange}
      submitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
