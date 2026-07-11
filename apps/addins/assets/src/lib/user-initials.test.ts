import { describe, expect, it } from "vitest";

import { getUserInitials } from "./user-initials";

describe("getUserInitials", () => {
  it("uses first letters from first and last name", () => {
    expect(getUserInitials({ name: "John Doe" })).toBe("JD");
  });

  it("uses first two characters for a single-word name", () => {
    expect(getUserInitials({ name: "Jo" })).toBe("JO");
    expect(getUserInitials({ name: "Alex" })).toBe("AL");
  });

  it("falls back to email local part when name is missing", () => {
    expect(getUserInitials({ email: "joost@deckpack.com" })).toBe("JO");
  });

  it("strips non-alphanumeric characters from email local part", () => {
    expect(getUserInitials({ email: "joost.windmoller@deckpack.com" })).toBe("JO");
  });

  it("prefers name over email", () => {
    expect(
      getUserInitials({
        name: "Joost Windmoller",
        email: "other@example.com",
      }),
    ).toBe("JW");
  });

  it("returns a placeholder when no usable identity is provided", () => {
    expect(getUserInitials({})).toBe("?");
    expect(getUserInitials({ name: "   ", email: "   " })).toBe("?");
  });
});
