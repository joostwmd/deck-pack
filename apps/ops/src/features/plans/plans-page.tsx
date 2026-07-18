import { OpsPageShell } from "@/components/ops-page-shell";

export function PlansPage() {
  return (
    <OpsPageShell
      title="Plans"
      description="Define subscription tiers, insert limits, and org seat inventory"
    >
      <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-12 text-center text-sm">
        Plan management is coming next — create tiers, set limits, and assign seats to
        organizations.
      </div>
    </OpsPageShell>
  );
}
