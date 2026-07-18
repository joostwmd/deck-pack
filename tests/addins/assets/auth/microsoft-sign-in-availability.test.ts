import { describe, expect, it } from "vitest";

import { getMicrosoftSignInAvailability } from "@/auth/microsoft-sign-in-availability";

describe("getMicrosoftSignInAvailability", () => {
  it("allows web preview without office constraints", () => {
    expect(
      getMicrosoftSignInAvailability({
        environment: "web",
        isNaaSupported: false,
        clientId: undefined,
      }),
    ).toEqual({ available: true, reason: null });
  });

  it("requires client id in office", () => {
    expect(
      getMicrosoftSignInAvailability({
        environment: "office",
        isNaaSupported: true,
        clientId: undefined,
      }).available,
    ).toBe(false);
  });

  it("requires NAA in office", () => {
    const result = getMicrosoftSignInAvailability({
      environment: "office",
      isNaaSupported: false,
      clientId: "client-id",
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain("Nested App Authentication");
  });
});
