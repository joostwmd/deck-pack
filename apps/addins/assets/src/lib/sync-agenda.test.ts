import { describe, expect, it, vi } from "vitest";

import { agendaConfigV1Schema } from "@deck-pack/agenda";

import { queueAgendaCloudEvent } from "./sync-agenda";

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    agenda: {
      sync: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("sync-agenda", () => {
  it("queues pending cloud events without duplicating ids", () => {
    const config = agendaConfigV1Schema.parse({
      schemaVersion: 1,
      agendaId: "11111111-1111-4111-8111-111111111111",
      revision: 1,
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

    const eventId = "99999999-9999-4999-8999-999999999999";
    const queuedOnce = queueAgendaCloudEvent(config, eventId);
    const queuedTwice = queueAgendaCloudEvent(queuedOnce, eventId);

    expect(queuedOnce.cloudSync.pendingEventIds).toEqual([eventId]);
    expect(queuedTwice.cloudSync.pendingEventIds).toEqual([eventId]);
  });
});
