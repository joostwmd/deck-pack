import type { FormattingActionId } from "@deck-pack/presentation-formatting";

export type FormatActionSection = "position" | "align" | "distribute" | "size" | "spacing" | "more";

export type FormatActionDefinition = {
  id: FormattingActionId;
  label: string;
  section: FormatActionSection;
  description?: string;
};

export const formatActionDefinitions: FormatActionDefinition[] = [
  { id: "align-left", label: "Align left", section: "align" },
  { id: "align-center", label: "Align center", section: "align" },
  { id: "align-right", label: "Align right", section: "align" },
  { id: "align-top", label: "Align top", section: "align" },
  { id: "align-middle", label: "Align middle", section: "align" },
  { id: "align-bottom", label: "Align bottom", section: "align" },
  { id: "distribute-horizontal", label: "Distribute horizontally", section: "distribute" },
  { id: "distribute-vertical", label: "Distribute vertically", section: "distribute" },
  { id: "match-width", label: "Match width", section: "size", description: "Uses the first selected object as reference" },
  { id: "match-height", label: "Match height", section: "size", description: "Uses the first selected object as reference" },
  { id: "match-both", label: "Match size", section: "size", description: "Uses the first selected object as reference" },
  { id: "stack-horizontal", label: "Stack horizontally", section: "spacing" },
  { id: "stack-vertical", label: "Stack vertically", section: "spacing" },
  { id: "gap-increase-horizontal", label: "Increase horizontal gap", section: "spacing" },
  { id: "gap-decrease-horizontal", label: "Decrease horizontal gap", section: "spacing" },
  { id: "gap-increase-vertical", label: "Increase vertical gap", section: "spacing" },
  { id: "gap-decrease-vertical", label: "Decrease vertical gap", section: "spacing" },
  { id: "swap-positions", label: "Swap positions", section: "more" },
  { id: "rectify-lines", label: "Rectify lines", section: "more" },
];

export const formatActionDefinitionById = Object.fromEntries(
  formatActionDefinitions.map((definition) => [definition.id, definition]),
) as Record<FormattingActionId, FormatActionDefinition | undefined>;

export function getActionsForSection(section: FormatActionSection) {
  return formatActionDefinitions.filter((definition) => definition.section === section);
}
