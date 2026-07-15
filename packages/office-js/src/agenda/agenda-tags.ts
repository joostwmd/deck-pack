import { DECKPACK_TAG_KEYS } from "@deck-pack/agenda";

import { isPowerPointApiAvailable, runPowerPoint } from "../utils";

export type AgendaTagInput = Record<string, string>;

export async function tagPresentation(tags: AgendaTagInput): Promise<void> {
  if (!isPowerPointApiAvailable("1.3")) {
    throw new Error("Agenda tagging requires PowerPointApi 1.3 or later.");
  }

  return runPowerPoint(async (context) => {
    for (const [key, value] of Object.entries(tags)) {
      context.presentation.tags.add(key, value);
    }
    await context.sync();
  });
}

export async function tagSlide(slideId: string, tags: AgendaTagInput): Promise<void> {
  if (!isPowerPointApiAvailable("1.3")) {
    throw new Error("Agenda tagging requires PowerPointApi 1.3 or later.");
  }

  return runPowerPoint(async (context) => {
    const slide = context.presentation.slides.getItem(slideId);
    for (const [key, value] of Object.entries(tags)) {
      slide.tags.add(key, value);
    }
    await context.sync();
  });
}

export async function tagShape(
  slideId: string,
  shapeId: string,
  tags: AgendaTagInput,
): Promise<void> {
  if (!isPowerPointApiAvailable("1.3")) {
    throw new Error("Agenda tagging requires PowerPointApi 1.3 or later.");
  }

  return runPowerPoint(async (context) => {
    const slide = context.presentation.slides.getItem(slideId);
    const shape = slide.shapes.getItem(shapeId);
    for (const [key, value] of Object.entries(tags)) {
      shape.tags.add(key, value);
    }
    await context.sync();
  });
}

export function buildAgendaSlideTags(input: {
  agendaId: string;
  entityId: string;
  role: string;
  sectionId?: string;
}): AgendaTagInput {
  const tags: AgendaTagInput = {
    [DECKPACK_TAG_KEYS.AGENDA_ID]: input.agendaId,
    [DECKPACK_TAG_KEYS.ENTITY_ID]: input.entityId,
    [DECKPACK_TAG_KEYS.AGENDA_ROLE]: input.role,
  };

  if (input.sectionId) {
    tags[DECKPACK_TAG_KEYS.SECTION_ID] = input.sectionId;
  }

  return tags;
}

export function buildAgendaShapeTags(input: {
  agendaId: string;
  entityId: string;
  slotId?: string;
  fieldRole?: string;
}): AgendaTagInput {
  const tags: AgendaTagInput = {
    [DECKPACK_TAG_KEYS.AGENDA_ID]: input.agendaId,
    [DECKPACK_TAG_KEYS.ENTITY_ID]: input.entityId,
  };

  if (input.slotId) {
    tags[DECKPACK_TAG_KEYS.SLOT_ID] = input.slotId;
  }

  if (input.fieldRole) {
    tags[DECKPACK_TAG_KEYS.FIELD_ROLE] = input.fieldRole;
  }

  return tags;
}
