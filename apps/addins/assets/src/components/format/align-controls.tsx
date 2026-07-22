import type { CommandApplicability } from "@/hooks/shared/use-powerpoint-selection";

import { FormatActionButton } from "./action-button";
import { getActionsForSection } from "./action-ui-registry";

interface SectionControlsProps {
  section: "align" | "distribute" | "size" | "spacing" | "more";
  applicabilityById: Map<string, CommandApplicability["applicability"]>;
  busyActionId: string | null;
  onAction: (id: CommandApplicability["id"]) => void;
}

export function AlignControls(props: Omit<SectionControlsProps, "section">) {
  return <SectionControls section="align" {...props} />;
}

export function DistributeControls(props: Omit<SectionControlsProps, "section">) {
  return <SectionControls section="distribute" {...props} />;
}

export function SizeControls(props: Omit<SectionControlsProps, "section">) {
  return <SectionControls section="size" {...props} />;
}

export function SpacingControls(props: Omit<SectionControlsProps, "section">) {
  return <SectionControls section="spacing" {...props} />;
}

export function MoreControls(props: Omit<SectionControlsProps, "section">) {
  return <SectionControls section="more" {...props} />;
}

function SectionControls({
  section,
  applicabilityById,
  busyActionId,
  onAction,
}: SectionControlsProps) {
  const actions = getActionsForSection(section);

  return (
    <div className="grid gap-2">
      {actions.map((action) => (
        <FormatActionButton
          key={action.id}
          id={action.id}
          label={action.label}
          description={action.description}
          applicability={
            applicabilityById.get(action.id) ?? {
              applicable: false,
              code: "unknown",
              reason: "Unavailable",
            }
          }
          busy={busyActionId === action.id}
          onClick={onAction}
        />
      ))}
    </div>
  );
}
