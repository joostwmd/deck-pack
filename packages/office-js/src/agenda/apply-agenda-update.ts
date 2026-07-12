import {
  AGENDA_ROLES,
  type AgendaConfigV1,
  type AgendaRowSlot,
  type AgendaSection,
  type AgendaTemplateMapping,
  type AgendaUpdatePlan,
  buildAgendaUpdatePlan,
  FIELD_ROLES,
  formatSectionNumber,
  reconcileAgendaConfig,
  sortSectionsBySlideIndex,
} from "@deck-pack/agenda";

import { officeClient } from "../client";
import { persistAgendaConfig } from "./agenda-settings";
import { buildAgendaShapeTags, buildAgendaSlideTags, tagPresentation, tagShape, tagSlide } from "./agenda-tags";
import {
  deleteSlideById,
  exportSlideAsBase64,
  moveSlideToIndex,
  scanAgendaDeck,
  setShapeText,
} from "./scan-agenda-deck";

export type TemplateMappingDraft = {
  templateSlideEntityId: string;
  nativeSlideIdHint: string;
  headingShapeEntityId: string;
  nativeHeadingShapeIdHint: string;
  rowSlots: AgendaRowSlot[];
  activeStyleSlotId: string;
  inactiveStyleSlotId: string;
};

export function validateTemplateMappingDraft(draft: TemplateMappingDraft): string[] {
  const errors: string[] = [];
  const shapeIds = new Set<string>();

  if (!draft.rowSlots.length) {
    errors.push("Add at least one row slot before continuing.");
  }

  for (const slot of draft.rowSlots) {
    for (const field of slot.fields) {
      if (shapeIds.has(field.shapeEntityId)) {
        errors.push("Each mapped shape can only be used once.");
      }
      shapeIds.add(field.shapeEntityId);
    }

    const roles = new Set(slot.fields.map((field) => field.fieldRole));
    if (!roles.has(FIELD_ROLES.SECTION_TITLE)) {
      errors.push("Each row slot needs a section title shape.");
    }
  }

  if (!draft.rowSlots.some((slot) => slot.slotId === draft.activeStyleSlotId)) {
    errors.push("Select a valid active-style row.");
  }

  if (!draft.rowSlots.some((slot) => slot.slotId === draft.inactiveStyleSlotId)) {
    errors.push("Select a valid inactive-style row.");
  }

  return errors;
}

export function buildTemplateMapping(draft: TemplateMappingDraft): AgendaTemplateMapping {
  return {
    ...draft,
    capacity: draft.rowSlots.length,
  };
}

function findShapeIdByEntityId(
  deck: Awaited<ReturnType<typeof scanAgendaDeck>>,
  entityId: string,
): { slideId: string; shapeId: string } | null {
  for (const shape of deck.shapes) {
    if (shape.tags.DECKPACK_ENTITY_ID === entityId) {
      return { slideId: shape.nativeSlideId, shapeId: shape.nativeShapeId };
    }
  }
  return null;
}

function findSlideIdByEntityId(
  deck: Awaited<ReturnType<typeof scanAgendaDeck>>,
  entityId: string,
): string | null {
  const slide = deck.slides.find((item) => item.tags.DECKPACK_ENTITY_ID === entityId);
  return slide?.nativeSlideId ?? null;
}


async function updateAgendaSlideContent(
  config: AgendaConfigV1,
  slideEntityId: string,
  activeSectionId?: string,
): Promise<void> {
  const deck = await scanAgendaDeck();
  const slideId = findSlideIdByEntityId(deck, slideEntityId);
  if (!slideId) {
    throw new Error("Agenda slide could not be found for content update.");
  }

  const heading = findShapeIdByEntityId(deck, config.template.headingShapeEntityId);
  if (heading) {
    await setShapeText(heading.slideId, heading.shapeId, "Contents");
  }

  const sortedSections = sortSectionsBySlideIndex(config.sections, deck);

  for (const [index, slot] of config.template.rowSlots.entries()) {
    const section = sortedSections[index];
    const numberField = slot.fields.find((field) => field.fieldRole === FIELD_ROLES.SECTION_NUMBER);
    const titleField = slot.fields.find((field) => field.fieldRole === FIELD_ROLES.SECTION_TITLE);
    const pageField = slot.fields.find((field) => field.fieldRole === FIELD_ROLES.PAGE_NUMBER);

    const numberShape = numberField
      ? findShapeIdByEntityId(deck, numberField.shapeEntityId)
      : null;
    const titleShape = titleField ? findShapeIdByEntityId(deck, titleField.shapeEntityId) : null;
    const pageShape = pageField ? findShapeIdByEntityId(deck, pageField.shapeEntityId) : null;

    if (!section) {
      if (numberShape) await setShapeText(numberShape.slideId, numberShape.shapeId, "");
      if (titleShape) await setShapeText(titleShape.slideId, titleShape.shapeId, "");
      if (pageShape) await setShapeText(pageShape.slideId, pageShape.shapeId, "");
      continue;
    }

    const pageNumber =
      deck.slides.find((slide) => slide.tags.DECKPACK_ENTITY_ID === section.startSlideEntityId)
        ?.index ?? null;

    if (numberShape) {
      await setShapeText(numberShape.slideId, numberShape.shapeId, formatSectionNumber(index));
    }
    if (titleShape) {
      await setShapeText(titleShape.slideId, titleShape.shapeId, section.title);
    }
    if (pageShape) {
      await setShapeText(
        pageShape.slideId,
        pageShape.shapeId,
        pageNumber == null ? "" : String(pageNumber + 1),
      );
    }
  }

  if (activeSectionId) {
    const activeIndex = sortedSections.findIndex(
      (section) => section.sectionId === activeSectionId,
    );
    if (activeIndex >= 0) {
      const activeSlot = config.template.rowSlots[activeIndex];
      if (activeSlot) {
        for (const field of activeSlot.fields) {
          const shape = findShapeIdByEntityId(deck, field.shapeEntityId);
          if (!shape) continue;
          const currentDeck = await scanAgendaDeck();
          const currentShape = currentDeck.shapes.find(
            (item) => item.nativeShapeId === shape.shapeId,
          );
          if (currentShape?.text) {
            await setShapeText(shape.slideId, shape.shapeId, currentShape.text);
          }
        }
      }
    }
  }
}

async function insertGeneratedSlideFromTemplate(input: {
  config: AgendaConfigV1;
  entityId: string;
  role: (typeof AGENDA_ROLES)[keyof typeof AGENDA_ROLES];
  sectionId?: string;
  targetSlideId: string;
}): Promise<string> {
  const templateBase64 = await exportSlideAsBase64(input.config.template.nativeSlideIdHint!);
  const before = await scanAgendaDeck();
  await officeClient.insertSlidesFromBase64(templateBase64, {
    targetSlideId: input.targetSlideId,
    formatting: PowerPoint.InsertSlideFormatting.keepSourceFormatting,
  });

  const after = await scanAgendaDeck();
  const newSlide = after.slides.find(
    (slide) => !before.slides.some((existing) => existing.nativeSlideId === slide.nativeSlideId),
  );

  if (!newSlide) {
    throw new Error("Failed to create generated agenda slide.");
  }

  await tagSlide(
    newSlide.nativeSlideId,
    buildAgendaSlideTags({
      agendaId: input.config.agendaId,
      entityId: input.entityId,
      role: input.role,
      sectionId: input.sectionId,
    }),
  );

  return newSlide.nativeSlideId;
}

export async function applyAgendaUpdatePlan(
  config: AgendaConfigV1,
  plan: AgendaUpdatePlan,
): Promise<AgendaConfigV1> {
  let workingConfig: AgendaConfigV1 = structuredClone(config);

  for (const action of plan.actions) {
    if (action.type === "delete_generated_slide") {
      const deck = await scanAgendaDeck();
      const slideId = findSlideIdByEntityId(deck, action.entityId);
      if (slideId) {
        await deleteSlideById(slideId);
      }
      workingConfig.generatedSlides = workingConfig.generatedSlides.filter(
        (slide) => slide.entityId !== action.entityId,
      );
      continue;
    }

    if (action.type === "create_opening_toc") {
      const entityId = crypto.randomUUID();
      const deck = await scanAgendaDeck();
      const firstSection = sortSectionsBySlideIndex(workingConfig.sections, deck)[0];
      const anchorSlideId = firstSection
        ? findSlideIdByEntityId(deck, firstSection.startSlideEntityId)
        : workingConfig.template.nativeSlideIdHint;

      if (!anchorSlideId) {
        throw new Error("Unable to determine where to insert the opening table of contents.");
      }

      const nativeSlideId = await insertGeneratedSlideFromTemplate({
        config: workingConfig,
        entityId,
        role: AGENDA_ROLES.OPENING_TOC,
        targetSlideId: anchorSlideId,
      });

      workingConfig.generatedSlides.push({
        entityId,
        role: AGENDA_ROLES.OPENING_TOC,
        nativeSlideIdHint: nativeSlideId,
      });
      continue;
    }

    if (action.type === "create_divider") {
      const entityId = crypto.randomUUID();
      const deck = await scanAgendaDeck();
      const section = workingConfig.sections.find((item) => item.sectionId === action.sectionId);
      if (!section) continue;

      const anchorSlideId = findSlideIdByEntityId(deck, section.startSlideEntityId);
      if (!anchorSlideId) {
        throw new Error(`Missing start slide for section "${section.title}".`);
      }

      const nativeSlideId = await insertGeneratedSlideFromTemplate({
        config: workingConfig,
        entityId,
        role: AGENDA_ROLES.SECTION_DIVIDER,
        sectionId: section.sectionId,
        targetSlideId: anchorSlideId,
      });

      workingConfig.generatedSlides.push({
        entityId,
        role: AGENDA_ROLES.SECTION_DIVIDER,
        sectionId: section.sectionId,
        nativeSlideIdHint: nativeSlideId,
      });
      continue;
    }

    if (action.type === "move_slide") {
      const deck = await scanAgendaDeck();
      const slideId = findSlideIdByEntityId(deck, action.entityId);
      if (slideId) {
        await moveSlideToIndex(slideId, action.targetIndex);
      }
      continue;
    }

    if (action.type === "update_slide_content") {
      await updateAgendaSlideContent(workingConfig, action.entityId, action.sectionId);
      continue;
    }
  }

  const deck = await scanAgendaDeck();
  const reconciled = reconcileAgendaConfig(workingConfig, deck);
  const nextConfig: AgendaConfigV1 = {
    ...reconciled.config,
    revision: plan.nextRevision,
    updatedAt: new Date().toISOString(),
  };

  await persistAgendaConfig(nextConfig);
  return nextConfig;
}

export async function createInitialAgendaConfig(input: {
  agendaId: string;
  template: AgendaTemplateMapping;
  sections: AgendaSection[];
}): Promise<AgendaConfigV1> {
  const now = new Date().toISOString();
  const config: AgendaConfigV1 = {
    schemaVersion: 1,
    agendaId: input.agendaId,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    template: input.template,
    sections: input.sections,
    generatedSlides: [],
    options: {
      openingTocEnabled: true,
      dividersEnabled: true,
      fullAgendaMode: true,
      physicalPageNumbers: true,
    },
    cloudSync: {
      lastSyncedRevision: 0,
      pendingEventIds: [],
    },
  };

  await tagPresentation({ DECKPACK_AGENDA_ID: input.agendaId });
  await tagSlide(
    input.template.nativeSlideIdHint!,
    buildAgendaSlideTags({
      agendaId: input.agendaId,
      entityId: input.template.templateSlideEntityId,
      role: AGENDA_ROLES.TEMPLATE,
    }),
  );

  for (const section of input.sections) {
    if (!section.nativeStartSlideIdHint) continue;
    await tagSlide(
      section.nativeStartSlideIdHint,
      buildAgendaSlideTags({
        agendaId: input.agendaId,
        entityId: section.startSlideEntityId,
        role: AGENDA_ROLES.SECTION_START,
        sectionId: section.sectionId,
      }),
    );
  }

  for (const slot of input.template.rowSlots) {
    for (const field of slot.fields) {
      if (!field.nativeShapeIdHint) continue;
      await tagShape(
        input.template.nativeSlideIdHint!,
        field.nativeShapeIdHint,
        buildAgendaShapeTags({
          agendaId: input.agendaId,
          entityId: field.shapeEntityId,
          slotId: slot.slotId,
          fieldRole: field.fieldRole,
        }),
      );
    }
  }

  const plan = buildAgendaUpdatePlan({ config, deck: await scanAgendaDeck() });
  return applyAgendaUpdatePlan(config, plan);
}

export async function updateAgendaFromDraft(
  config: AgendaConfigV1,
  sections: AgendaSection[],
): Promise<AgendaConfigV1> {
  const draft: AgendaConfigV1 = {
    ...config,
    sections,
    updatedAt: new Date().toISOString(),
  };
  const deck = await scanAgendaDeck();
  const plan = buildAgendaUpdatePlan({
    config: draft,
    deck,
    previousSections: config.sections,
  });
  return applyAgendaUpdatePlan(draft, plan);
}
