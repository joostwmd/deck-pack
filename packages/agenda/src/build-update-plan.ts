import { AGENDA_ROLES } from "./constants";
import { getSectionPageNumber, sortSectionsBySlideIndex } from "./reconcile";
import type {
  AgendaConfigV1,
  AgendaSection,
  AgendaUpdatePlan,
  ObservedDeck,
  UpdatePlanAction,
} from "./types";

export type BuildUpdatePlanInput = {
  config: AgendaConfigV1;
  deck: ObservedDeck;
  previousSections?: AgendaSection[];
};

function findGeneratedSlideIndex(
  deck: ObservedDeck,
  entityId: string,
): number | null {
  const slide = deck.slides.find((item) => item.tags.DECKPACK_ENTITY_ID === entityId);
  return slide ? slide.index : null;
}

function findSectionStartIndex(deck: ObservedDeck, section: AgendaSection): number | null {
  const slide = deck.slides.find(
    (item) => item.tags.DECKPACK_ENTITY_ID === section.startSlideEntityId,
  );
  return slide ? slide.index : null;
}

export function buildAgendaUpdatePlan(input: BuildUpdatePlanInput): AgendaUpdatePlan {
  const { config, deck, previousSections = [] } = input;
  const actions: UpdatePlanAction[] = [];
  const sortedSections = sortSectionsBySlideIndex(config.sections, deck);

  let createdDividers = 0;
  let deletedSlides = 0;
  let movedSlides = 0;
  let updatedSlides = 0;
  let renamedSections = 0;
  let pageNumberRefreshes = 0;

  const previousTitleById = new Map(previousSections.map((section) => [section.sectionId, section.title]));
  for (const section of sortedSections) {
    if (previousTitleById.get(section.sectionId) !== section.title) {
      renamedSections += 1;
    }
    if (getSectionPageNumber(section, deck) !== null) {
      pageNumberRefreshes += 1;
    }
  }

  if (config.options.openingTocEnabled) {
    const openingToc = config.generatedSlides.find((slide) => slide.role === AGENDA_ROLES.OPENING_TOC);
    if (!openingToc) {
      actions.push({ type: "create_opening_toc" });
      createdDividers += 1;
      updatedSlides += 1;
    } else {
      const currentIndex = findGeneratedSlideIndex(deck, openingToc.entityId);
      const firstSectionIndex = sortedSections[0]
        ? findSectionStartIndex(deck, sortedSections[0])
        : null;
      if (
        currentIndex !== null &&
        firstSectionIndex !== null &&
        currentIndex !== firstSectionIndex
      ) {
        actions.push({
          type: "move_slide",
          entityId: openingToc.entityId,
          targetIndex: firstSectionIndex,
        });
        movedSlides += 1;
      }
      actions.push({ type: "update_slide_content", entityId: openingToc.entityId });
      updatedSlides += 1;
    }
  }

  if (config.options.dividersEnabled) {
    for (const section of sortedSections) {
      const divider = config.generatedSlides.find(
        (slide) => slide.role === AGENDA_ROLES.SECTION_DIVIDER && slide.sectionId === section.sectionId,
      );
      const targetIndex = findSectionStartIndex(deck, section);

      if (!divider) {
        actions.push({ type: "create_divider", sectionId: section.sectionId });
        createdDividers += 1;
        updatedSlides += 1;
        continue;
      }

      const currentIndex = findGeneratedSlideIndex(deck, divider.entityId);
      if (currentIndex !== null && targetIndex !== null && currentIndex !== targetIndex) {
        actions.push({
          type: "move_slide",
          entityId: divider.entityId,
          targetIndex,
        });
        movedSlides += 1;
      }

      actions.push({
        type: "update_slide_content",
        entityId: divider.entityId,
        sectionId: section.sectionId,
      });
      updatedSlides += 1;
    }
  }

  const activeSectionIds = new Set(sortedSections.map((section) => section.sectionId));
  for (const generated of config.generatedSlides) {
    if (generated.role === AGENDA_ROLES.SECTION_DIVIDER && generated.sectionId) {
      if (!activeSectionIds.has(generated.sectionId)) {
        actions.push({ type: "delete_generated_slide", entityId: generated.entityId });
        deletedSlides += 1;
      }
    }
  }

  actions.push({ type: "repair_native_hints" });

  return {
    actions,
    summary: {
      createdDividers,
      deletedSlides,
      movedSlides,
      updatedSlides,
      renamedSections,
      pageNumberRefreshes,
    },
    nextRevision: config.revision + 1,
  };
}

export function isUpdatePlanIdempotent(
  left: AgendaUpdatePlan,
  right: AgendaUpdatePlan,
): boolean {
  return JSON.stringify(left.actions) === JSON.stringify(right.actions);
}
