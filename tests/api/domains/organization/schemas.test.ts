import { describe, expect, it } from "vitest";

import { organizationEmailSchema, organizationSlugSchema } from "@deck-pack/api/domains/organization/schemas";

describe("organizationEmailSchema", () => {
  it("accepts trimmed valid email", () => {
    expect(organizationEmailSchema.safeParse("  Me@Mail.com ").success).toBe(true);
    expect(organizationEmailSchema.parse("me@example.com")).toBeDefined();
  });

  it("rejects blank and invalid formats", () => {
    expect(organizationEmailSchema.safeParse("").success).toBe(false);
    expect(organizationEmailSchema.safeParse("   ").success).toBe(false);
    expect(organizationEmailSchema.safeParse("not-email").success).toBe(false);
  });
});

describe("organizationSlugSchema", () => {
  it("accepts lowercase alphanumeric with internal hyphens", () => {
    expect(organizationSlugSchema.safeParse("acme-org-2").success).toBe(true);
  });

  it("rejects uppercase, whitespace, slashes, trailing hyphen", () => {
    expect(organizationSlugSchema.safeParse("NOPE").success).toBe(false);
    expect(organizationSlugSchema.safeParse(" ").success).toBe(false);
    expect(organizationSlugSchema.safeParse("acme org").success).toBe(false);
    expect(organizationSlugSchema.safeParse("acme/team").success).toBe(false);
    expect(organizationSlugSchema.safeParse("acme-").success).toBe(false);
  });
});
