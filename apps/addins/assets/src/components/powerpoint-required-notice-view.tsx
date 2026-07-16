import { WarningCircle } from "@phosphor-icons/react";

import { EmptyState } from "@/components/asset-picker/empty-state";

export type PowerPointNoticeKind = "host" | "api";

export interface PowerPointRequiredNoticeViewProps {
  kind: PowerPointNoticeKind;
  minApi?: string;
}

export function PowerPointRequiredNoticeView({ kind, minApi }: PowerPointRequiredNoticeViewProps) {
  if (kind === "host") {
    return (
      <EmptyState
        icon={WarningCircle}
        title="Office required"
        description="Open this add-in inside PowerPoint to use this feature."
      />
    );
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
    >
      <WarningCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        This feature requires PowerPoint API {minApi} or later. Update PowerPoint to a newer build to
        enable it.
      </p>
    </div>
  );
}
