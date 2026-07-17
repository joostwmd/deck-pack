import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { serviceFail, serviceOk, toTrpcError } from "./service-result";

describe("service-result", () => {
  it("serviceOk wraps data", () => {
    expect(serviceOk({ id: "1" })).toEqual({ ok: true, data: { id: "1" } });
  });

  it("serviceFail carries code and message", () => {
    expect(serviceFail("conflict", { message: "Slug taken" })).toEqual({
      ok: false,
      code: "conflict",
      message: "Slug taken",
      details: undefined,
    });
  });

  it.each([
    ["not_found", "NOT_FOUND"],
    ["conflict", "CONFLICT"],
    ["forbidden", "FORBIDDEN"],
    ["invalid_state", "BAD_REQUEST"],
    ["internal", "INTERNAL_SERVER_ERROR"],
  ] as const)("toTrpcError maps %s to %s", (code, trpcCode) => {
    const err = toTrpcError(serviceFail(code, { message: "custom" }));
    expect(err).toBeInstanceOf(TRPCError);
    expect(err.code).toBe(trpcCode);
    expect(err.message).toBe("custom");
  });

  it("toTrpcError uses default message when omitted", () => {
    const err = toTrpcError(serviceFail("not_found"));
    expect(err.message).toBe("Resource not found");
  });
});
