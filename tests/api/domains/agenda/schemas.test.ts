import { describe, expect, it } from "vitest";

import {
  getAgendaInputSchema,
  syncAgendaInputSchema,
} from "@deck-pack/api/domains/agenda/schemas";

describe("agenda schemas", () => {
  it("rejects malformed sync payloads", () => {
    const result = syncAgendaInputSchema.safeParse({
      configuration: { schemaVersion: 2 },
      configurationHash: "abc",
      eventId: "not-a-uuid",
      eventType: "created",
      client: "office",
      metadata: {},
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid get input", () => {
    const result = getAgendaInputSchema.safeParse({
      documentAgendaId: "11111111-1111-4111-8111-111111111111",
    });

    expect(result.success).toBe(true);
  });
});
