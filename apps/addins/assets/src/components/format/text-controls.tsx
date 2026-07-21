import type { CommandApplicability } from "@/hooks/shared/use-powerpoint-selection";

import { FormatActionButton } from "./action-button";
import { getActionsForSection, type FormatActionSection } from "./action-ui-registry";

interface TextControlsProps {
  applicabilityById: Map<string, CommandApplicability["applicability"]>;
  busyActionId: string | null;
  onAction: (id: CommandApplicability["id"]) => void;
}

function TextSectionControls({
  section,
  title,
  applicabilityById,
  busyActionId,
  onAction,
}: TextControlsProps & { section: FormatActionSection; title: string }) {
  const actions = getActionsForSection(section);

  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-medium">{title}</h2>
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
    </section>
  );
}

export function TextControls(props: TextControlsProps) {
  return (
    <div className="grid gap-4">
      <TextSectionControls section="text-autofit" title="Autofit" {...props} />
      <TextSectionControls section="text-margins" title="Margins" {...props} />
      <TextSectionControls section="text-wrap" title="Word wrap" {...props} />
      <TextSectionControls section="text-vertical-align" title="Vertical alignment" {...props} />
      <TextSectionControls section="text-swap" title="Swap text" {...props} />
    </div>
  );
}
