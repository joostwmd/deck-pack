import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { agendaConfigV1Schema, buildConfigurationHash } from "@deck-pack/agenda";

import { db } from "../index";
import { syncAgenda } from "./syncAgenda";
import { agendaEvents, agendaInstances } from "../schema/agendas";
import { user } from "../schema/auth";
import { ensureMigrationsApplied } from "../test-utils/ensure-migrations";
import { tx } from "../transaction";

describe("syncAgenda (integration)", () => {
  beforeEach(async () => {
    await ensureMigrationsApplied();
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE agenda_events, agenda_instances, asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`,
      ),
    );
  });

  it("upserts snapshot and records idempotent events", async () => {
    const userId = crypto.randomUUID();
    const now = new Date();

    await tx.insert(user).values({
      id: userId,
      name: "Agenda User",
      email: "agenda@integration.test.local",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: null,
    });

    const config = agendaConfigV1Schema.parse({
      schemaVersion: 1,
      agendaId: "11111111-1111-4111-8111-111111111111",
      revision: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
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

    const first = await syncAgenda({
      tx,
      input: {
        userId,
        documentAgendaId: config.agendaId,
        schemaVersion: 1,
        revision: 1,
        configuration: config,
        configurationHash: buildConfigurationHash(config),
        sectionCount: 0,
        generatedSlideCount: 0,
        event: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          eventType: "created",
          client: "office",
          revision: 1,
          metadata: { sectionCount: 0 },
        },
      },
    });

    expect(first?.revision).toBe(1);

    const retry = await syncAgenda({
      tx,
      input: {
        userId,
        documentAgendaId: config.agendaId,
        schemaVersion: 1,
        revision: 1,
        configuration: config,
        configurationHash: buildConfigurationHash(config),
        sectionCount: 0,
        generatedSlideCount: 0,
        event: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          eventType: "created",
          client: "office",
          revision: 1,
        },
      },
    });

    expect(retry?.id).toBe(first?.id);

    const events = await tx.select().from(agendaEvents);
    expect(events).toHaveLength(1);

    const instances = await tx.select().from(agendaInstances);
    expect(instances).toHaveLength(1);
  });
});
