import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { ConflictError, ForbiddenError, InvalidStateError, NotFoundError } from "@deck-pack/errors";
import { normalizeProcedureError } from "@deck-pack/api/trpc/error-mapping";

describe("normalizeProcedureError", () => {
  it("preserves TRPCError instances", () => {
    const inner = new TRPCError({
      code: "BAD_REQUEST",
      message: "invalid",
    });
    const out = normalizeProcedureError(inner);
    expect(out).toBe(inner);
  });

  it("maps NotFoundError to NOT_FOUND", () => {
    const out = normalizeProcedureError(new NotFoundError("missing"));
    expect(out.code).toBe("NOT_FOUND");
    expect(out.message).toBe("missing");
  });

  it("maps ConflictError to CONFLICT", () => {
    const out = normalizeProcedureError(new ConflictError("duplicate"));
    expect(out.code).toBe("CONFLICT");
  });

  it("maps ForbiddenError to FORBIDDEN", () => {
    const out = normalizeProcedureError(new ForbiddenError("denied"));
    expect(out.code).toBe("FORBIDDEN");
  });

  it("maps InvalidStateError to BAD_REQUEST", () => {
    const out = normalizeProcedureError(new InvalidStateError("bad state"));
    expect(out.code).toBe("BAD_REQUEST");
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
