export type IssueSeverity = "info" | "warning" | "error";
export type FixMode = "none" | "confirm" | "automatic";

export type TextRole = "title" | "subtitle" | "body" | "caption" | "footer" | "unknown";

export interface TypographyRoleRule {
  allowedFonts: string[];
  minimumSize?: number;
  maximumSize?: number;
  allowedColors?: string[];
}

export interface ColorToken {
  id: string;
  name: string;
  hex: string;
  roles: Array<"text" | "fill" | "outline" | "background">;
}

export interface RuleOverride {
  enabled: boolean;
  severity: IssueSeverity;
  fixMode: FixMode;
  parameters?: Record<string, unknown>;
}

export interface BrandProfileConfiguration {
  typography: {
    roles: {
      title: TypographyRoleRule;
      body: TypographyRoleRule;
      subtitle?: TypographyRoleRule;
      caption?: TypographyRoleRule;
      footer?: TypographyRoleRule;
    };
    fallbackFonts: string[];
  };
  colors: {
    palette: ColorToken[];
    maximumColorDistance: number;
    allowTintsAndShades: boolean;
  };
  layout?: {
    safeMargins?: { top: number; right: number; bottom: number; left: number };
    slideWidth?: number;
    slideHeight?: number;
  };
  rules: Record<string, RuleOverride>;
}

export const BRAND_PROFILE_SCHEMA_VERSION = 1;

export const DEFAULT_BRAND_PROFILE_CONFIGURATION: BrandProfileConfiguration = {
  typography: {
    roles: {
      title: { allowedFonts: ["Calibri"], minimumSize: 24, maximumSize: 44 },
      body: { allowedFonts: ["Calibri"], minimumSize: 12, maximumSize: 24 },
    },
    fallbackFonts: ["Arial"],
  },
  colors: {
    palette: [
      {
        id: "primary",
        name: "Primary",
        hex: "#0057B8",
        roles: ["text", "fill", "outline"],
      },
    ],
    maximumColorDistance: 12,
    allowTintsAndShades: true,
  },
  rules: {
    "typography.unapproved-font": { enabled: true, severity: "error", fixMode: "confirm" },
    "typography.font-size": { enabled: true, severity: "warning", fixMode: "none" },
    "text.duplicate-word": { enabled: true, severity: "warning", fixMode: "automatic" },
    "text.whitespace": { enabled: true, severity: "warning", fixMode: "automatic" },
    "text.empty": { enabled: true, severity: "warning", fixMode: "none" },
    "color.unapproved-text": { enabled: true, severity: "error", fixMode: "confirm" },
    "geometry.off-slide": { enabled: true, severity: "error", fixMode: "none" },
    "accessibility.missing-alt-text": { enabled: true, severity: "warning", fixMode: "none" },
  },
};

export const RULE_PRESETS = {
  essential: [
    "typography.unapproved-font",
    "text.duplicate-word",
    "text.whitespace",
    "geometry.off-slide",
  ],
  standard: Object.keys(DEFAULT_BRAND_PROFILE_CONFIGURATION.rules),
  strict: Object.keys(DEFAULT_BRAND_PROFILE_CONFIGURATION.rules),
} as const;

export function applyRulePreset(
  preset: keyof typeof RULE_PRESETS,
  base: BrandProfileConfiguration = DEFAULT_BRAND_PROFILE_CONFIGURATION,
): BrandProfileConfiguration {
  const enabledRules = new Set(RULE_PRESETS[preset]);
  const rules = Object.fromEntries(
    Object.entries(base.rules).map(([key, value]) => [
      key,
      { ...value, enabled: enabledRules.has(key) },
    ]),
  ) as Record<string, RuleOverride>;

  return { ...base, rules };
}
