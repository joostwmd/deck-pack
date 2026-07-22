import { DECKPACK_TAG_KEYS } from "./constants";
import type {
  AgendaConfigV1,
  AgendaSection,
  ObservedDeck,
  ObservedSlide,
  ReconcileIssue,
  ReconcileResult,
} from "./types";

function findSlideByEntityId(deck: ObservedDeck, entityId: string): ObservedSlide | undefined {
  return deck.slides.find((slide) => slide.tags[DECKPACK_TAG_KEYS.ENTITY_ID] === entityId);
}

function findSlideByNativeId(deck: ObservedDeck, nativeSlideId: string): ObservedSlide | undefined {
  return deck.slides.find((slide) => slide.nativeSlideId === nativeSlideId);
}

function findGeneratedSlide(
  deck: ObservedDeck,
  entityId: string,
): ObservedSlide | undefined {
  return deck.slides.find(
    (slide) =>
      slide.tags[DECKPACK_TAG_KEYS.ENTITY_ID] === entityId &&
      slide.tags[DECKPACK_TAG_KEYS.AGENDA_ROLE] !== undefined,
  );
}

export function sortSectionsBySlideIndex(
  sections: AgendaSection[],
  deck: ObservedDeck,
): AgendaSection[] {
  return [...sections].sort((left, right) => {
    const leftSlide = findSlideByEntityId(deck, left.startSlideEntityId);
    const rightSlide = findSlideByEntityId(deck, right.startSlideEntityId);
    const leftIndex = leftSlide?.index ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = rightSlide?.index ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export function getSectionPageNumber(section: AgendaSection, deck: ObservedDeck): number | null {
  const slide =
    findSlideByEntityId(deck, section.startSlideEntityId) ??
    (section.nativeStartSlideIdHint
      ? findSlideByNativeId(deck, section.nativeStartSlideIdHint)
      : undefined);

  return slide ? slide.index + 1 : null;
}

export function reconcileAgendaConfig(
  config: AgendaConfigV1,
  deck: ObservedDeck,
): ReconcileResult {
  const issues: ReconcileIssue[] = [];
  const repairedConfig: AgendaConfigV1 = structuredClone(config);
  let needsRepair = false;
  let needsUpdate = false;

  const templateSlide = findSlideByEntityId(deck, config.template.templateSlideEntityId);
  if (!templateSlide) {
    issues.push({
      code: "template_missing",
      message: "The agenda template slide could not be found in the presentation.",
      entityId: config.template.templateSlideEntityId,
    });
    needsRepair = true;
  } else if (templateSlide.nativeSlideId !== config.template.nativeSlideIdHint) {
    repairedConfig.template.nativeSlideIdHint = templateSlide.nativeSlideId;
    issues.push({
      code: "stale_native_hint",
      message: "Template slide native ID hint was refreshed.",
      entityId: config.template.templateSlideEntityId,
    });
    needsRepair = true;
  }

  if (config.sections.length > config.template.capacity) {
    issues.push({
      code: "capacity_exceeded",
      message: `The agenda has ${config.sections.length} sections but the template only supports ${config.template.capacity}.`,
    });
    needsRepair = true;
  }

  const sortedSections = sortSectionsBySlideIndex(config.sections, deck);
  if (JSON.stringify(sortedSections.map((section) => section.sectionId)) !== JSON.stringify(config.sections.map((section) => section.sectionId))) {
    repairedConfig.sections = sortedSections;
    needsUpdate = true;
  }

  for (const section of repairedConfig.sections) {
    const startSlide = findSlideByEntityId(deck, section.startSlideEntityId);
    if (!startSlide) {
      issues.push({
        code: "missing_start_slide",
        message: `The starting slide for "${section.title}" is missing.`,
        sectionId: section.sectionId,
        entityId: section.startSlideEntityId,
      });
      needsRepair = true;
      continue;
    }

    if (startSlide.nativeSlideId !== section.nativeStartSlideIdHint) {
      section.nativeStartSlideIdHint = startSlide.nativeSlideId;
      issues.push({
        code: "stale_native_hint",
        message: `Start slide hint refreshed for "${section.title}".`,
        sectionId: section.sectionId,
        entityId: section.startSlideEntityId,
      });
      needsRepair = true;
    }
  }

  if (config.options.openingTocEnabled) {
    const openingToc = config.generatedSlides.find((slide) => slide.role === "opening_toc");
    if (openingToc && !findGeneratedSlide(deck, openingToc.entityId)) {
      issues.push({
        code: "missing_opening_toc",
        message: "The opening table of contents slide is missing.",
        entityId: openingToc.entityId,
      });
      needsRepair = true;
    }
  }

  if (config.options.dividersEnabled) {
    for (const section of repairedConfig.sections) {
      const divider = config.generatedSlides.find(
        (slide) => slide.role === "section_divider" && slide.sectionId === section.sectionId,
      );
      if (divider && !findGeneratedSlide(deck, divider.entityId)) {
        issues.push({
          code: "missing_divider",
          message: `The divider for "${section.title}" is missing.`,
          sectionId: section.sectionId,
          entityId: divider.entityId,
        });
        needsRepair = true;
      }
    }
  }

  for (const slide of deck.slides) {
    const agendaId = slide.tags[DECKPACK_TAG_KEYS.AGENDA_ID];
    const entityId = slide.tags[DECKPACK_TAG_KEYS.ENTITY_ID];
    if (agendaId === config.agendaId && entityId) {
      const known = config.generatedSlides.some((generated) => generated.entityId === entityId);
      if (!known && slide.tags[DECKPACK_TAG_KEYS.AGENDA_ROLE]) {
        issues.push({
          code: "orphan_generated_slide",
          message: "An unknown generated agenda slide was found in the presentation.",
          entityId,
        });
        needsRepair = true;
      }
    }
  }

  return {
    config: repairedConfig,
    issues,
    needsRepair,
    needsUpdate,
  };
}

export function formatSectionNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}
