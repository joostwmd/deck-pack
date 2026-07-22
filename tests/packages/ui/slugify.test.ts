import { describe, expect, it } from "vitest";

import { slugifyName } from "@deck-pack/ui/lib/slugify";

describe("slugifyName", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyName("Acme Corp")).toBe("acme-corp");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugifyName("  --Hello World-- ")).toBe("hello-world");
  });
});
