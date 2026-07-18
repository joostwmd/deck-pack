import { describe, expect, it } from "vitest";

import {
  assertOpsOtpAllowed,
  emailMatchesAdminDomain,
  isOpsAuthRequest,
} from "@deck-pack/auth/ops-soft-gate";
import { APIError } from "better-auth";

describe("ops soft gate", () => {
  const opsOrigins = ["http://localhost:3001"];
  const adminDomain = "code.berlin";

  it("detects ops requests from Origin", () => {
    const headers = new Headers({ Origin: "http://localhost:3001" });
    expect(isOpsAuthRequest(headers, opsOrigins)).toBe(true);
  });

  it("detects ops requests from Referer when Origin is absent", () => {
    const headers = new Headers({ Referer: "http://localhost:3001/login" });
    expect(isOpsAuthRequest(headers, opsOrigins)).toBe(true);
  });

  it("allows non-admin emails when origin is not ops", () => {
    expect(() =>
      assertOpsOtpAllowed({
        path: "/email-otp/send-verification-otp",
        email: "user@example.com",
        headers: new Headers({ Origin: "http://localhost:3002" }),
        opsOrigins,
        adminEmailDomain: adminDomain,
      }),
    ).not.toThrow();
  });

  it("rejects non-admin emails when origin is ops", () => {
    expect(() =>
      assertOpsOtpAllowed({
        path: "/email-otp/send-verification-otp",
        email: "user@example.com",
        headers: new Headers({ Origin: "http://localhost:3001" }),
        opsOrigins,
        adminEmailDomain: adminDomain,
      }),
    ).toThrow(APIError);
  });

  it("allows admin-domain emails from ops origin", () => {
    expect(() =>
      assertOpsOtpAllowed({
        path: "/sign-in/email-otp",
        email: "admin@code.berlin",
        headers: new Headers({ Origin: "http://localhost:3001" }),
        opsOrigins,
        adminEmailDomain: adminDomain,
      }),
    ).not.toThrow();
  });

  it("matches admin email domain case-insensitively", () => {
    expect(emailMatchesAdminDomain("Admin@Code.Berlin", "code.berlin")).toBe(true);
  });
});
