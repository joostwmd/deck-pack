import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  ArchiveBrandProfile,
  BrandProfileNotFoundError,
  CreateBrandProfile,
  DuplicateBrandProfile,
  GetBrandProfile,
  InMemoryBrandProfilesRepository,
  ListBrandProfiles,
  SetDefaultBrandProfile,
  UpdateBrandProfile,
} from "@deck-pack/brand-profiles";
import {
  DEFAULT_BRAND_PROFILE_CONFIGURATION,
  brandProfileConfigurationSchema,
} from "@deck-pack/brand-compliance";

describe("brand profile configuration schema (via presentation-check)", () => {
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

describe("brand-profiles use-cases", () => {
  it("creates, lists, and gets a profile", async () => {
    const repo = new InMemoryBrandProfilesRepository();
    const created = await new CreateBrandProfile(repo).execute({
      userId: "user-1",
      name: "Corporate",
      isDefault: true,
      configuration: DEFAULT_BRAND_PROFILE_CONFIGURATION,
    });

    expect(created.name).toBe("Corporate");
    expect(created.isDefault).toBe(true);
    expect(created.version?.version).toBe(1);

    const listed = await new ListBrandProfiles(repo).execute({ userId: "user-1" });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);

    const got = await new GetBrandProfile(repo).execute({
      userId: "user-1",
      profileId: created.id,
    });
    expect(got.name).toBe("Corporate");
  });

  it("throws BrandProfileNotFoundError for missing profile", async () => {
    const repo = new InMemoryBrandProfilesRepository();
    await expect(
      new GetBrandProfile(repo).execute({
        userId: "user-1",
        profileId: crypto.randomUUID(),
      }),
    ).rejects.toBeInstanceOf(BrandProfileNotFoundError);
  });

  it("updates by appending a version", async () => {
    const repo = new InMemoryBrandProfilesRepository();
    const created = await new CreateBrandProfile(repo).execute({
      userId: "user-1",
      name: "A",
      configuration: DEFAULT_BRAND_PROFILE_CONFIGURATION,
    });

    const updated = await new UpdateBrandProfile(repo).execute({
      userId: "user-1",
      profileId: created.id,
      name: "B",
      configuration: DEFAULT_BRAND_PROFILE_CONFIGURATION,
    });

    expect(updated.name).toBe("B");
    expect(updated.version?.version).toBe(2);
  });

  it("duplicates a profile", async () => {
    const repo = new InMemoryBrandProfilesRepository();
    const created = await new CreateBrandProfile(repo).execute({
      userId: "user-1",
      name: "Original",
      configuration: DEFAULT_BRAND_PROFILE_CONFIGURATION,
    });

    const copy = await new DuplicateBrandProfile(repo).execute({
      userId: "user-1",
      profileId: created.id,
      name: "Copy",
    });

    expect(copy.id).not.toBe(created.id);
    expect(copy.name).toBe("Copy");
  });

  it("setDefault enforces single default", async () => {
    const repo = new InMemoryBrandProfilesRepository();
    const a = await new CreateBrandProfile(repo).execute({
      userId: "user-1",
      name: "A",
      isDefault: true,
      configuration: DEFAULT_BRAND_PROFILE_CONFIGURATION,
    });
    const b = await new CreateBrandProfile(repo).execute({
      userId: "user-1",
      name: "B",
      configuration: DEFAULT_BRAND_PROFILE_CONFIGURATION,
    });

    await new SetDefaultBrandProfile(repo).execute({
      userId: "user-1",
      profileId: b.id,
    });

    const listed = await new ListBrandProfiles(repo).execute({ userId: "user-1" });
    expect(listed.find((p) => p.id === a.id)?.isDefault).toBe(false);
    expect(listed.find((p) => p.id === b.id)?.isDefault).toBe(true);
  });

  it("archives a profile and hides it from list", async () => {
    const repo = new InMemoryBrandProfilesRepository();
    const created = await new CreateBrandProfile(repo).execute({
      userId: "user-1",
      name: "Temp",
      configuration: DEFAULT_BRAND_PROFILE_CONFIGURATION,
    });

    await new ArchiveBrandProfile(repo).execute({
      userId: "user-1",
      profileId: created.id,
    });

    const listed = await new ListBrandProfiles(repo).execute({ userId: "user-1" });
    expect(listed).toHaveLength(0);
  });
});
