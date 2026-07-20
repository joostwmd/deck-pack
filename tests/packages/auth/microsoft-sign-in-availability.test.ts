import { describe, expect, it } from "vitest";

import { getMicrosoftSignInAvailability } from "@deck-pack/auth/microsoft-sign-in";

describe("getMicrosoftSignInAvailability", () => {
  it("allows web preview without office constraints", () => {
    expect(
      getMicrosoftSignInAvailability({
        host: "web",
        isNaaSupported: false,
        clientId: undefined,
      }),
    ).toEqual({ available: true, reason: null });
  });

  it("requires client id in office", () => {
    expect(
      getMicrosoftSignInAvailability({
        host: "office",
        isNaaSupported: true,
        clientId: undefined,
      }).available,
    ).toBe(false);
  });

  it("requires NAA in office", () => {
    const result = getMicrosoftSignInAvailability({
      host: "office",
      isNaaSupported: false,
      clientId: "client-id",
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain("Nested App Authentication");
  });
});
