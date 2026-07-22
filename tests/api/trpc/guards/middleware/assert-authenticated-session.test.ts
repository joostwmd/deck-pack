import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { SessionPayload } from "@deck-pack/api/types";

import { assertAuthenticatedSession } from "@deck-pack/api/trpc/guards/middleware/require-authenticated-session";

function minimalPayload(userPresent: boolean): SessionPayload {
  const base = {
    session: { id: "sess-1" },
    user: userPresent ? { id: "u1", name: "U", email: "u@test.local" } : null,
  };
  return base as unknown as SessionPayload;
}

describe("assertAuthenticatedSession", () => {
  it("throws UNAUTHORIZED when signed out", () => {
    expect(() => assertAuthenticatedSession(null)).toThrow(TRPCError);
    try {
      assertAuthenticatedSession(null);
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect((e as TRPCError).code).toBe("UNAUTHORIZED");
    }
  });

  it("throws when user missing on payload", () => {
    expect(() => assertAuthenticatedSession(minimalPayload(false))).toThrow(TRPCError);
  });

  it("returns session when user present", () => {
    const s = minimalPayload(true);
    const out = assertAuthenticatedSession(s);
    expect(out.user.id).toBe("u1");
  });
});
