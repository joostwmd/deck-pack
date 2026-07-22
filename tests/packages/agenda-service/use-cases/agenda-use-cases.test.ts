import { describe, expect, it } from "vitest";

import { agendaConfigV1Schema } from "@deck-pack/agenda";
import {
  AgendaNotFoundError,
  GetAgendaForUser,
  SyncAgendaForUser,
} from "@deck-pack/agenda-service";
import { InMemoryAgendaServiceRepository } from "@deck-pack/agenda-service/repositories/in-memory-agenda-service-repository";

function createConfig(revision: number) {
  return agendaConfigV1Schema.parse({
    schemaVersion: 1,
    agendaId: "11111111-1111-4111-8111-111111111111",
    revision,
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
}

describe("SyncAgendaForUser", () => {
  it("creates an agenda instance", async () => {
    const repo = new InMemoryAgendaServiceRepository();
    const result = await new SyncAgendaForUser(repo).execute({
      userId: "user-1",
      configuration: createConfig(1),
      configurationHash: "hash-value-long-enough",
      eventId: "22222222-2222-4222-8222-222222222222",
      eventType: "created",
      client: "office",
      metadata: {
        sectionCount: 1,
        generatedSlideCount: 2,
      },
    });

    expect(result.revision).toBe(1);
    expect(result.instanceId).toBeTruthy();
  });

  it("skips snapshot update when revision is older", async () => {
    const repo = new InMemoryAgendaServiceRepository();
    const sync = new SyncAgendaForUser(repo);
    const agendaId = "11111111-1111-4111-8111-111111111111";

    await sync.execute({
      userId: "user-1",
      configuration: createConfig(5),
      configurationHash: "hash-value-long-enough",
      eventId: "22222222-2222-4222-8222-222222222222",
      eventType: "updated",
      client: "office",
      metadata: { sectionCount: 1, generatedSlideCount: 2 },
    });

    const result = await sync.execute({
      userId: "user-1",
      configuration: createConfig(2),
      configurationHash: "hash-value-long-enough-2",
      eventId: "33333333-3333-4333-8333-333333333333",
      eventType: "updated",
      client: "office",
      metadata: { sectionCount: 1, generatedSlideCount: 2 },
    });

    expect(result.revision).toBe(5);
    const stored = await repo.findInstance({
      userId: "user-1",
      documentAgendaId: agendaId,
    });
    expect(stored?.revision).toBe(5);
    expect(stored?.configuration).toMatchObject({ revision: 5 });
  });
});

describe("GetAgendaForUser", () => {
  it("returns stored instance", async () => {
    const repo = new InMemoryAgendaServiceRepository();
    const now = new Date();
    const configuration = createConfig(3);
    repo.seed([
      {
        id: "inst-1",
        userId: "user-1",
        documentAgendaId: configuration.agendaId,
        schemaVersion: 1,
        revision: 3,
        configuration,
        configurationHash: "hash",
        sectionCount: 1,
        generatedSlideCount: 2,
        updatedAt: now,
        lastSyncedAt: now,
      },
    ]);

    const instance = await new GetAgendaForUser(repo).execute({
      userId: "user-1",
      documentAgendaId: configuration.agendaId,
    });
    expect(instance.id).toBe("inst-1");
    expect(instance.revision).toBe(3);
  });

  it("throws AgendaNotFoundError when missing", async () => {
    const repo = new InMemoryAgendaServiceRepository();
    await expect(
      new GetAgendaForUser(repo).execute({
        userId: "user-1",
        documentAgendaId: "11111111-1111-4111-8111-111111111111",
      }),
    ).rejects.toBeInstanceOf(AgendaNotFoundError);
  });
});
