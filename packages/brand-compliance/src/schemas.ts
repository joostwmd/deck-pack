import { z } from "zod";

import { BRAND_PROFILE_SCHEMA_VERSION } from "./profile";

export const issueSeveritySchema = z.enum(["info", "warning", "error"]);
export const fixModeSchema = z.enum(["none", "confirm", "automatic"]);

export const typographyRoleRuleSchema = z.object({
  allowedFonts: z.array(z.string().trim().min(1)).min(1),
  minimumSize: z.number().positive().optional(),
  maximumSize: z.number().positive().optional(),
  allowedColors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
});

export const colorTokenSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  roles: z.array(z.enum(["text", "fill", "outline", "background"])).min(1),
});

export const ruleOverrideSchema = z.object({
  enabled: z.boolean(),
  severity: issueSeveritySchema,
  fixMode: fixModeSchema,
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const brandProfileConfigurationSchema = z.object({
  typography: z.object({
    roles: z.object({
      title: typographyRoleRuleSchema,
      body: typographyRoleRuleSchema,
      subtitle: typographyRoleRuleSchema.optional(),
      caption: typographyRoleRuleSchema.optional(),
      footer: typographyRoleRuleSchema.optional(),
    }),
    fallbackFonts: z.array(z.string().trim().min(1)),
  }),
  colors: z.object({
    palette: z.array(colorTokenSchema),
    maximumColorDistance: z.number().min(0).max(100),
    allowTintsAndShades: z.boolean(),
  }),
  layout: z
    .object({
      safeMargins: z
        .object({
          top: z.number().min(0),
          right: z.number().min(0),
          bottom: z.number().min(0),
          left: z.number().min(0),
        })
        .optional(),
      slideWidth: z.number().positive().optional(),
      slideHeight: z.number().positive().optional(),
    })
    .optional(),
  rules: z.record(z.string(), ruleOverrideSchema),
});

export type BrandProfileConfigurationInput = z.infer<typeof brandProfileConfigurationSchema>;

export function normalizeBrandProfileConfiguration(
  input: BrandProfileConfigurationInput,
): BrandProfileConfigurationInput {
  return brandProfileConfigurationSchema.parse(input);
}

export const brandProfileSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  activeVersionId: z.string().nullable(),
  versionNumber: z.number().nullable(),
  schemaVersion: z.number().nullable(),
  configuration: brandProfileConfigurationSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const brandProfileDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  activeVersionId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  version: z
    .object({
      id: z.string(),
      version: z.number(),
      schemaVersion: z.number(),
      configuration: brandProfileConfigurationSchema,
      createdAt: z.coerce.date(),
    })
    .nullable(),
});

export { BRAND_PROFILE_SCHEMA_VERSION };
