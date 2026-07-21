import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_REQUIRED_MESSAGE,
  QUOTA_EXCEEDED_MESSAGE,
  getUserFacingApiErrorMessage,
  isAuthenticationError,
  isQuotaExceededError,
} from "@/lib/user-facing-api-error";

describe("getUserFacingApiErrorMessage", () => {
  it("standardizes tRPC UNAUTHORIZED errors", () => {
    const error = Object.assign(new Error("Request failed"), {
      data: { code: "UNAUTHORIZED" },
    });

    expect(getUserFacingApiErrorMessage(error, "Could not load assets")).toBe(
      AUTHENTICATION_REQUIRED_MESSAGE,
    );
  });

  it("standardizes HTTP 401 errors nested in a tRPC shape", () => {
    const error = Object.assign(new Error("Request failed"), {
      shape: { data: { httpStatus: 401 } },
    });

    expect(getUserFacingApiErrorMessage(error, "Could not load assets")).toBe(
      AUTHENTICATION_REQUIRED_MESSAGE,
    );
  });

  it("maps quota exceeded errors to an upgrade message", () => {
    const error = Object.assign(new Error("Monthly insert limit reached for logo"), {
      cause: { code: "quota_exceeded", assetType: "logo" },
    });

    expect(getUserFacingApiErrorMessage(error, "Error inserting logo")).toBe(
      QUOTA_EXCEEDED_MESSAGE,
    );
  });

  it("preserves genuine network error messages", () => {
    const error = new TypeError("Failed to fetch");

    expect(getUserFacingApiErrorMessage(error, "Could not load assets")).toBe("Failed to fetch");
  });

  it("uses the supplied fallback for unknown errors", () => {
    expect(getUserFacingApiErrorMessage(null, "Could not load assets")).toBe(
      "Could not load assets",
    );
  });
});

describe("isAuthenticationError", () => {
  it("distinguishes authentication failures from network failures", () => {
    expect(isAuthenticationError({ data: { code: "UNAUTHORIZED" } })).toBe(true);
    expect(isAuthenticationError(new TypeError("Failed to fetch"))).toBe(false);
  });
});

describe("isQuotaExceededError", () => {
  it("detects quota details nested on the error cause", () => {
    expect(
      isQuotaExceededError({
        message: "Request failed",
        cause: { code: "quota_exceeded" },
      }),
    ).toBe(true);
    expect(isQuotaExceededError(new TypeError("Failed to fetch"))).toBe(false);
  });
});
