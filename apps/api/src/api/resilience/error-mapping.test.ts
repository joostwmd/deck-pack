import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { normalizeProcedureError } from "./error-mapping";

describe("normalizeProcedureError", () => {
  it("preserves TRPCError instances", () => {
    const inner = new TRPCError({
      code: "BAD_REQUEST",
      message: "invalid",
    });
    const out = normalizeProcedureError(inner);
    expect(out).toBe(inner);
  });

  it("wraps non-TRPC errors as INTERNAL_SERVER_ERROR with cause", () => {
    const cause = new Error("boom");
    const out = normalizeProcedureError(cause);
    expect(out).toBeInstanceOf(TRPCError);
    expect(out.code).toBe("INTERNAL_SERVER_ERROR");
    expect(out.message).toBe("An unexpected error occurred");
    expect(out.cause).toBe(cause);
  });

  it("normalizes primitives", () => {
    const out = normalizeProcedureError("string-oops");
    expect(out.code).toBe("INTERNAL_SERVER_ERROR");
    expect(out.message).toBe("An unexpected error occurred");
    // TRPCError may wrap non-Error values on `cause`; assert the originating value survives.
    const { cause } = out;
    if (cause instanceof Error) expect(cause.message).toContain("string-oops");
    else expect(cause).toBe("string-oops");
  });
});
