import { describe, expect, it } from "vitest";

import { buildConfigurationHash } from "./analytics";
import { agendaConfigV1Schema, safeParseAgendaConfig } from "./schemas";

describe("agenda schemas", () => {
  it("rejects unsupported schema versions", () => {
    const result = safeParseAgendaConfig({
      schemaVersion: 2,
      agendaId: "11111111-1111-4111-8111-111111111111",
    });

    expect(result.success).toBe(false);
  });

  it("parses a valid agenda config", () => {
    const parsed = agendaConfigV1Schema.parse({
      schemaVersion: 1,
      agendaId: "11111111-1111-4111-8111-111111111111",
      revision: 0,
      createdAt: "2026-07-12T10:00:00.000Z",
      updatedAt: "2026-07-12T10:00:00.000Z",
      template: {
        templateSlideEntityId: "22222222-2222-4222-8222-222222222222",
        headingShapeEntityId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        rowSlots: [
          {
            slotId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            fields: [
              {
                shapeEntityId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                fieldRole: "section_title",
              },
            ],
          },
        ],
        activeStyleSlotId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        inactiveStyleSlotId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        capacity: 4,
      },
      sections: [],
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
    });

    expect(parsed.revision).toBe(0);
    expect(buildConfigurationHash(parsed)).toMatch(/^[0-9a-f]{8}$/);
  });
});
