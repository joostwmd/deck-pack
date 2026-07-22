import { describe, expect, it } from "vitest";

import {
  photoColorSchema,
  photoLocaleSchema,
  photoOrientationSchema,
  photoSearchInputSchema,
  photoSizeSchema,
} from "@deck-pack/photos/schemas";

describe("photo schemas", () => {
  it("accepts photo search filters and pagination defaults", () => {
    const parsed = photoSearchInputSchema.parse({
      query: "ocean",
      orientation: "landscape",
      color: "#112233",
      locale: "en-US",
    });

    expect(parsed).toEqual({
      query: "ocean",
      orientation: "landscape",
      color: "#112233",
      locale: "en-US",
      page: 1,
      perPage: 24,
    });
  });

  it("rejects invalid photo filter values", () => {
    expect(() => photoOrientationSchema.parse("panorama")).toThrow();
    expect(() => photoSizeSchema.parse("huge")).toThrow();
    expect(() => photoColorSchema.parse("#12")).toThrow();
    expect(() => photoLocaleSchema.parse("en-GB")).toThrow();
    expect(() =>
      photoSearchInputSchema.parse({
        query: "ocean",
        page: 0,
      }),
    ).toThrow();
  });
});
