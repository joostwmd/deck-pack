import type { FormattingActionId } from "@deck-pack/presentation-formatting";

export type FormatDomain = "shapes" | "text";

export type FormatActionSection =
  | "position"
  | "align"
  | "distribute"
  | "size"
  | "spacing"
  | "more"
  | "text-autofit"
  | "text-margins"
  | "text-wrap"
  | "text-vertical-align"
  | "text-swap";

export type FormatActionDefinition = {
  id: FormattingActionId;
  label: string;
  section: FormatActionSection;
  domain: FormatDomain;
  description?: string;
};

export const formatActionDefinitions: FormatActionDefinition[] = [
  { id: "align-left", label: "Align left", section: "align", domain: "shapes" },
  { id: "align-center", label: "Align center", section: "align", domain: "shapes" },
  { id: "align-right", label: "Align right", section: "align", domain: "shapes" },
  { id: "align-top", label: "Align top", section: "align", domain: "shapes" },
  { id: "align-middle", label: "Align middle", section: "align", domain: "shapes" },
  { id: "align-bottom", label: "Align bottom", section: "align", domain: "shapes" },
  { id: "distribute-horizontal", label: "Distribute horizontally", section: "distribute", domain: "shapes" },
  { id: "distribute-vertical", label: "Distribute vertically", section: "distribute", domain: "shapes" },
  {
    id: "match-width",
    label: "Match width",
    section: "size",
    domain: "shapes",
    description: "Uses the first selected object as reference",
  },
  {
    id: "match-height",
    label: "Match height",
    section: "size",
    domain: "shapes",
    description: "Uses the first selected object as reference",
  },
  {
    id: "match-both",
    label: "Match size",
    section: "size",
    domain: "shapes",
    description: "Uses the first selected object as reference",
  },
  { id: "stack-horizontal", label: "Stack left", section: "spacing", domain: "shapes" },
  { id: "stack-vertical", label: "Stack top", section: "spacing", domain: "shapes" },
  { id: "stack-bottom", label: "Stack bottom", section: "spacing", domain: "shapes" },
  { id: "stack-right", label: "Stack right", section: "spacing", domain: "shapes" },
  { id: "gap-increase-horizontal", label: "Increase horizontal gap", section: "spacing", domain: "shapes" },
  { id: "gap-decrease-horizontal", label: "Decrease horizontal gap", section: "spacing", domain: "shapes" },
  { id: "gap-increase-vertical", label: "Increase vertical gap", section: "spacing", domain: "shapes" },
  { id: "gap-decrease-vertical", label: "Decrease vertical gap", section: "spacing", domain: "shapes" },
  { id: "gap-remove-horizontal", label: "Remove horizontal gap", section: "spacing", domain: "shapes" },
  { id: "gap-remove-vertical", label: "Remove vertical gap", section: "spacing", domain: "shapes" },
  { id: "swap-positions", label: "Swap positions (center)", section: "more", domain: "shapes" },
  { id: "swap-top-left", label: "Swap top-left", section: "more", domain: "shapes" },
  { id: "swap-top-right", label: "Swap top-right", section: "more", domain: "shapes" },
  { id: "swap-bottom-left", label: "Swap bottom-left", section: "more", domain: "shapes" },
  { id: "swap-bottom-right", label: "Swap bottom-right", section: "more", domain: "shapes" },
  { id: "rectify-lines", label: "Rectify lines", section: "more", domain: "shapes" },
  { id: "text-autofit-none", label: "Do not autofit", section: "text-autofit", domain: "text" },
  { id: "text-autofit-shrink-text", label: "Shrink text on overflow", section: "text-autofit", domain: "text" },
  { id: "text-autofit-resize-shape", label: "Resize shape to fit text", section: "text-autofit", domain: "text" },
  { id: "text-margin-remove", label: "Remove text margins", section: "text-margins", domain: "text" },
  { id: "text-margin-increase", label: "Increase text margins", section: "text-margins", domain: "text" },
  { id: "text-margin-decrease", label: "Decrease text margins", section: "text-margins", domain: "text" },
  { id: "text-wrap-on", label: "Wrap text on", section: "text-wrap", domain: "text" },
  { id: "text-wrap-off", label: "Wrap text off", section: "text-wrap", domain: "text" },
  { id: "text-vertical-top", label: "Align text top", section: "text-vertical-align", domain: "text" },
  { id: "text-vertical-middle", label: "Align text middle", section: "text-vertical-align", domain: "text" },
  { id: "text-vertical-bottom", label: "Align text bottom", section: "text-vertical-align", domain: "text" },
  { id: "swap-text", label: "Swap text", section: "text-swap", domain: "text", description: "Swaps plain text between two objects" },
];

export const formatActionDefinitionById = Object.fromEntries(
  formatActionDefinitions.map((definition) => [definition.id, definition]),
) as Record<FormattingActionId, FormatActionDefinition | undefined>;

export function getActionsForSection(section: FormatActionSection) {
  return formatActionDefinitions.filter((definition) => definition.section === section);
}

export function getSectionsForDomain(domain: FormatDomain): FormatActionSection[] {
  const sections = new Set<FormatActionSection>();
  for (const definition of formatActionDefinitions) {
    if (definition.domain === domain) {
      sections.add(definition.section);
    }
  }
  return [...sections];
}
