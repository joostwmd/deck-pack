import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  DEFAULT_BRAND_PROFILE_CONFIGURATION,
  brandProfileConfigurationSchema,
} from "@deck-pack/presentation-check";

describe("brand profile configuration schema", () => {
  it("accepts the default configuration", () => {
    const parsed = brandProfileConfigurationSchema.parse(DEFAULT_BRAND_PROFILE_CONFIGURATION);
    expect(parsed.typography.roles.title.allowedFonts).toContain("Calibri");
  });

  it("rejects invalid color tokens", () => {
    const invalid = {
      ...DEFAULT_BRAND_PROFILE_CONFIGURATION,
      colors: {
        ...DEFAULT_BRAND_PROFILE_CONFIGURATION.colors,
        palette: [
          {
            id: "bad",
            name: "Bad",
            hex: "not-a-color",
            roles: ["text"],
          },
        ],
      },
    };

    expect(() => brandProfileConfigurationSchema.parse(invalid)).toThrow(z.ZodError);
  });
});
