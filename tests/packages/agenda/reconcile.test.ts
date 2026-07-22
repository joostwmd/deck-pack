import { describe, expect, it } from "vitest";

import { buildAgendaUpdatePlan, isUpdatePlanIdempotent } from "@deck-pack/agenda/build-update-plan";
import { AGENDA_ROLES } from "@deck-pack/agenda/constants";
import { reconcileAgendaConfig, sortSectionsBySlideIndex } from "@deck-pack/agenda/reconcile";
import { agendaConfigV1Schema } from "@deck-pack/agenda/schemas";
import type { AgendaConfigV1, ObservedDeck } from "@deck-pack/agenda/types";

function createConfig(overrides: Partial<AgendaConfigV1> = {}): AgendaConfigV1 {
  const agendaId = "11111111-1111-4111-8111-111111111111";
  const templateSlideEntityId = "22222222-2222-4222-8222-222222222222";
  const sectionA = "33333333-3333-4333-8333-333333333333";
  const sectionB = "44444444-4444-4444-8444-444444444444";
  const startA = "55555555-5555-4555-8555-555555555555";
  const startB = "66666666-6666-4666-8666-666666666666";
  const openingToc = "77777777-7777-4777-8777-777777777777";
  const dividerA = "88888888-8888-4888-8888-888888888888";
  const dividerB = "99999999-9999-4999-8999-999999999999";
  const slotId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  return agendaConfigV1Schema.parse({
    schemaVersion: 1,
    agendaId,
    revision: 1,
    createdAt: "2026-07-12T10:00:00.000Z",
    updatedAt: "2026-07-12T10:00:00.000Z",
    template: {
      templateSlideEntityId,
      nativeSlideIdHint: "100",
      headingShapeEntityId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      rowSlots: [
        {
          slotId,
          fields: [
            {
              shapeEntityId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              fieldRole: "section_number",
            },
            {
              shapeEntityId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
              fieldRole: "section_title",
            },
            {
              shapeEntityId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
              fieldRole: "page_number",
            },
          ],
        },
      ],
      activeStyleSlotId: slotId,
      inactiveStyleSlotId: slotId,
      capacity: 4,
    },
    sections: [
      {
        sectionId: sectionA,
        title: "Executive Summary",
        startSlideEntityId: startA,
        nativeStartSlideIdHint: "201",
      },
      {
        sectionId: sectionB,
        title: "Market Analysis",
        startSlideEntityId: startB,
        nativeStartSlideIdHint: "301",
      },
    ],
    generatedSlides: [
      { entityId: openingToc, role: AGENDA_ROLES.OPENING_TOC, nativeSlideIdHint: "150" },
      {
        entityId: dividerA,
        role: AGENDA_ROLES.SECTION_DIVIDER,
        sectionId: sectionA,
        nativeSlideIdHint: "200",
      },
      {
        entityId: dividerB,
        role: AGENDA_ROLES.SECTION_DIVIDER,
        sectionId: sectionB,
        nativeSlideIdHint: "300",
      },
    ],
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
    ...overrides,
  });
}

function createDeck(): ObservedDeck {
  return {
    slides: [
      {
        nativeSlideId: "100",
        index: 0,
        title: "Contents",
        tags: {
          DECKPACK_ENTITY_ID: "22222222-2222-4222-8222-222222222222",
          DECKPACK_AGENDA_ID: "11111111-1111-4111-8111-111111111111",
          DECKPACK_AGENDA_ROLE: AGENDA_ROLES.TEMPLATE,
        },
      },
      {
        nativeSlideId: "150",
        index: 1,
        title: "Contents",
        tags: {
          DECKPACK_ENTITY_ID: "77777777-7777-4777-8777-777777777777",
          DECKPACK_AGENDA_ID: "11111111-1111-4111-8111-111111111111",
          DECKPACK_AGENDA_ROLE: AGENDA_ROLES.OPENING_TOC,
        },
      },
      {
        nativeSlideId: "200",
        index: 2,
        title: "Contents",
        tags: {
          DECKPACK_ENTITY_ID: "88888888-8888-4888-8888-888888888888",
          DECKPACK_AGENDA_ID: "11111111-1111-4111-8111-111111111111",
          DECKPACK_AGENDA_ROLE: AGENDA_ROLES.SECTION_DIVIDER,
          DECKPACK_SECTION_ID: "33333333-3333-4333-8333-333333333333",
        },
      },
      {
        nativeSlideId: "201",
        index: 3,
        title: "Executive Summary",
        tags: {
          DECKPACK_ENTITY_ID: "55555555-5555-4555-8555-555555555555",
          DECKPACK_AGENDA_ID: "11111111-1111-4111-8111-111111111111",
          DECKPACK_AGENDA_ROLE: AGENDA_ROLES.SECTION_START,
          DECKPACK_SECTION_ID: "33333333-3333-4333-8333-333333333333",
        },
      },
      {
        nativeSlideId: "300",
        index: 4,
        title: "Contents",
        tags: {
          DECKPACK_ENTITY_ID: "99999999-9999-4999-8999-999999999999",
          DECKPACK_AGENDA_ID: "11111111-1111-4111-8111-111111111111",
          DECKPACK_AGENDA_ROLE: AGENDA_ROLES.SECTION_DIVIDER,
          DECKPACK_SECTION_ID: "44444444-4444-4444-8444-444444444444",
        },
      },
      {
        nativeSlideId: "301",
        index: 5,
        title: "Market Analysis",
        tags: {
          DECKPACK_ENTITY_ID: "66666666-6666-4666-8666-666666666666",
          DECKPACK_AGENDA_ID: "11111111-1111-4111-8111-111111111111",
          DECKPACK_AGENDA_ROLE: AGENDA_ROLES.SECTION_START,
          DECKPACK_SECTION_ID: "44444444-4444-4444-8444-444444444444",
        },
      },
    ],
    shapes: [],
  };
}

describe("reconcileAgendaConfig", () => {
  it("sorts sections by observed slide index", () => {
    const config = createConfig({
      sections: [
        {
          sectionId: "44444444-4444-4444-8444-444444444444",
          title: "Market Analysis",
          startSlideEntityId: "66666666-6666-4666-8666-666666666666",
        },
        {
          sectionId: "33333333-3333-4333-8333-333333333333",
          title: "Executive Summary",
          startSlideEntityId: "55555555-5555-4555-8555-555555555555",
        },
      ],
    });

    const sorted = sortSectionsBySlideIndex(config.sections, createDeck());
    expect(sorted.map((section) => section.title)).toEqual([
      "Executive Summary",
      "Market Analysis",
    ]);
  });

  it("detects missing divider and stale native hints", () => {
    const config = createConfig();
    const deck = createDeck();
    deck.slides = deck.slides.filter((slide) => slide.nativeSlideId !== "300");

    const result = reconcileAgendaConfig(config, deck);
    expect(result.needsRepair).toBe(true);
    expect(result.issues.some((issue) => issue.code === "missing_divider")).toBe(true);
  });

  it("flags capacity overflow", () => {
    const config = createConfig({
      template: {
        ...createConfig().template,
        capacity: 1,
      },
      sections: [
        ...createConfig().sections,
        {
          sectionId: "12121212-1212-4121-8121-121212121212",
          title: "Recommendations",
          startSlideEntityId: "13131313-1313-4131-8131-131313131313",
        },
      ],
    });

    const result = reconcileAgendaConfig(config, createDeck());
    expect(result.issues.some((issue) => issue.code === "capacity_exceeded")).toBe(true);
  });
});

describe("buildAgendaUpdatePlan", () => {
  it("creates missing divider actions", () => {
    const config = createConfig({
      generatedSlides: createConfig().generatedSlides.filter(
        (slide) => slide.role !== AGENDA_ROLES.SECTION_DIVIDER,
      ),
    });

    const plan = buildAgendaUpdatePlan({ config, deck: createDeck() });
    expect(plan.actions.some((action) => action.type === "create_divider")).toBe(true);
    expect(plan.summary.createdDividers).toBeGreaterThan(0);
  });

  it("is idempotent for the same input", () => {
    const config = createConfig();
    const deck = createDeck();
    const first = buildAgendaUpdatePlan({ config, deck });
    const second = buildAgendaUpdatePlan({ config, deck });
    expect(isUpdatePlanIdempotent(first, second)).toBe(true);
  });
});
