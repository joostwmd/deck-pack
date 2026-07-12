import { describe, expect, it } from "vitest";

import { clearBearerToken, getBearerToken, setBearerToken } from "./bearer-session-store";

describe("bearer session store", () => {
  it("stores and returns the bearer token in memory", () => {
    clearBearerToken();
    expect(getBearerToken()).toBeNull();

    setBearerToken("signed.session.token");
    expect(getBearerToken()).toBe("signed.session.token");
  });

  it("clears the bearer token", () => {
    setBearerToken("signed.session.token");
    clearBearerToken();
    expect(getBearerToken()).toBeNull();
  });
});
