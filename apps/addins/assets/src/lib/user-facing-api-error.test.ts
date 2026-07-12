import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_REQUIRED_MESSAGE,
  getUserFacingApiErrorMessage,
  isAuthenticationError,
} from "./user-facing-api-error";

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
