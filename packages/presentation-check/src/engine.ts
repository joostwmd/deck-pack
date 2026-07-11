import type { BrandProfileConfiguration, TextRole } from "./profile";
import type { CheckFinding, PresentationSnapshot, ShapeSnapshot } from "./types";
import { colorDistance, isApprovedColor, normalizeFontName } from "./color";

function createFindingId(ruleId: string, slideId: string, shapeId: string, suffix = ""): string {
  return `${ruleId}:${slideId}:${shapeId}${suffix ? `:${suffix}` : ""}`;
}

function inferTextRole(shape: ShapeSnapshot): TextRole {
  const placeholder = shape.placeholderType?.toLowerCase() ?? "";
  if (placeholder.includes("title")) return "title";
  if (placeholder.includes("subtitle")) return "subtitle";
  if (placeholder.includes("footer")) return "footer";
  if (placeholder.includes("body") || placeholder.includes("content")) return "body";
  if (shape.name.toLowerCase().includes("title")) return "title";
  return "body";
}

function getRoleRule(profile: BrandProfileConfiguration, role: TextRole) {
  switch (role) {
    case "title":
      return profile.typography.roles.title;
    case "subtitle":
      return profile.typography.roles.subtitle ?? profile.typography.roles.title;
    case "caption":
      return profile.typography.roles.caption ?? profile.typography.roles.body;
    case "footer":
      return profile.typography.roles.footer ?? profile.typography.roles.body;
    default:
      return profile.typography.roles.body;
  }
}

function isFontAllowed(fontName: string | null, allowed: string[], fallbacks: string[]): boolean {
  const normalized = normalizeFontName(fontName);
  if (!normalized) return true;
  const allowedSet = new Set([...allowed, ...fallbacks].map((font) => font.toLowerCase()));
  return allowedSet.has(normalized.toLowerCase());
}

function checkUnapprovedFonts(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["typography.unapproved-font"];
  if (!rule?.enabled) return findings;

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      for (const range of shape.textRanges) {
        const role = inferTextRole(shape);
        const roleRule = getRoleRule(profile, role);
        if (isFontAllowed(range.fontName, roleRule.allowedFonts, profile.typography.fallbackFonts)) {
          continue;
        }

        findings.push({
          id: createFindingId("typography.unapproved-font", slide.id, shape.id, `${range.start}`),
          ruleId: "typography.unapproved-font",
          category: "Typography",
          severity: rule.severity,
          message: "Text uses a font that is not approved for this role",
          actual: range.fontName ?? "Unknown",
          expected: roleRule.allowedFonts.join(", "),
          location: {
            slideId: slide.id,
            slideIndex: slide.index,
            shapeId: shape.id,
            shapeName: shape.name,
            textStart: range.start,
            textLength: range.length,
          },
          fixMode: rule.fixMode,
          suggestedFix: {
            type: "set-font-name",
            safe: true,
            payload: {
              fontName: roleRule.allowedFonts[0],
              textStart: range.start,
              textLength: range.length,
            },
          },
        });
      }
    }
  }

  return findings;
}

function checkFontSize(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["typography.font-size"];
  if (!rule?.enabled) return findings;

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      for (const range of shape.textRanges) {
        if (range.fontSize == null) continue;
        const roleRule = getRoleRule(profile, inferTextRole(shape));
        const min = roleRule.minimumSize;
        const max = roleRule.maximumSize;
        if (min != null && range.fontSize < min) {
          findings.push({
            id: createFindingId("typography.font-size", slide.id, shape.id, `min-${range.start}`),
            ruleId: "typography.font-size",
            category: "Typography",
            severity: rule.severity,
            message: "Text is smaller than the approved minimum size",
            actual: `${range.fontSize} pt`,
            expected: `>= ${min} pt`,
            location: {
              slideId: slide.id,
              slideIndex: slide.index,
              shapeId: shape.id,
              shapeName: shape.name,
              textStart: range.start,
              textLength: range.length,
            },
            fixMode: rule.fixMode,
          });
        }
        if (max != null && range.fontSize > max) {
          findings.push({
            id: createFindingId("typography.font-size", slide.id, shape.id, `max-${range.start}`),
            ruleId: "typography.font-size",
            category: "Typography",
            severity: rule.severity,
            message: "Text is larger than the approved maximum size",
            actual: `${range.fontSize} pt`,
            expected: `<= ${max} pt`,
            location: {
              slideId: slide.id,
              slideIndex: slide.index,
              shapeId: shape.id,
              shapeName: shape.name,
              textStart: range.start,
              textLength: range.length,
            },
            fixMode: rule.fixMode,
          });
        }
      }
    }
  }

  return findings;
}

function checkDuplicateWords(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["text.duplicate-word"];
  if (!rule?.enabled) return findings;

  const duplicatePattern = /\b(\w+)\s+\1\b/gi;

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      if (!shape.text) continue;
      const matches = [...shape.text.matchAll(duplicatePattern)];
      for (const match of matches) {
        findings.push({
          id: createFindingId("text.duplicate-word", slide.id, shape.id, String(match.index ?? 0)),
          ruleId: "text.duplicate-word",
          category: "Text",
          severity: rule.severity,
          message: "Duplicate consecutive word detected",
          actual: match[0] ?? "",
          expected: "Single word",
          location: {
            slideId: slide.id,
            slideIndex: slide.index,
            shapeId: shape.id,
            shapeName: shape.name,
            textStart: match.index ?? 0,
            textLength: match[0]?.length ?? 0,
          },
          fixMode: rule.fixMode,
          suggestedFix: {
            type: "replace-text-range",
            safe: true,
            payload: {
              textStart: match.index ?? 0,
              textLength: match[0]?.length ?? 0,
              replacement: match[1] ?? "",
            },
          },
        });
      }
    }
  }

  return findings;
}

function checkWhitespace(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["text.whitespace"];
  if (!rule?.enabled) return findings;

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      if (!shape.text) continue;
      if (/\s{2,}/.test(shape.text)) {
        findings.push({
          id: createFindingId("text.whitespace", slide.id, shape.id, "double-space"),
          ruleId: "text.whitespace",
          category: "Text",
          severity: rule.severity,
          message: "Repeated whitespace detected",
          actual: "Multiple spaces",
          expected: "Single spaces",
          location: {
            slideId: slide.id,
            slideIndex: slide.index,
            shapeId: shape.id,
            shapeName: shape.name,
          },
          fixMode: rule.fixMode,
          suggestedFix: {
            type: "normalize-whitespace",
            safe: true,
            payload: {},
          },
        });
      }
      if (/^\s|\s$/.test(shape.text)) {
        findings.push({
          id: createFindingId("text.whitespace", slide.id, shape.id, "edge-space"),
          ruleId: "text.whitespace",
          category: "Text",
          severity: rule.severity,
          message: "Leading or trailing whitespace detected",
          actual: "Edge whitespace",
          expected: "Trimmed text",
          location: {
            slideId: slide.id,
            slideIndex: slide.index,
            shapeId: shape.id,
            shapeName: shape.name,
          },
          fixMode: rule.fixMode,
          suggestedFix: {
            type: "trim-text",
            safe: true,
            payload: {},
          },
        });
      }
    }
  }

  return findings;
}

function checkEmptyText(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["text.empty"];
  if (!rule?.enabled) return findings;

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      if (shape.type.toLowerCase() !== "placeholder") continue;
      if (shape.text && shape.text.trim().length > 0) continue;
      findings.push({
        id: createFindingId("text.empty", slide.id, shape.id),
        ruleId: "text.empty",
        category: "Text",
        severity: rule.severity,
        message: "Placeholder contains no text",
        actual: "Empty",
        expected: "Non-empty placeholder text",
        location: {
          slideId: slide.id,
          slideIndex: slide.index,
          shapeId: shape.id,
          shapeName: shape.name,
        },
        fixMode: rule.fixMode,
      });
    }
  }

  return findings;
}

function checkUnapprovedTextColors(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["color.unapproved-text"];
  if (!rule?.enabled) return findings;

  const palette = profile.colors.palette
    .filter((token) => token.roles.includes("text"))
    .map((token) => token.hex);

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      for (const range of shape.textRanges) {
        if (!range.fontColor) continue;
        if (isApprovedColor(range.fontColor, palette, profile.colors.maximumColorDistance)) {
          continue;
        }
        const nearest = palette
          .map((hex) => ({ hex, distance: colorDistance(range.fontColor!, hex) }))
          .sort((a, b) => a.distance - b.distance)[0];

        findings.push({
          id: createFindingId("color.unapproved-text", slide.id, shape.id, `${range.start}`),
          ruleId: "color.unapproved-text",
          category: "Colors",
          severity: rule.severity,
          message: "Text color is outside the approved palette",
          actual: range.fontColor,
          expected: nearest?.hex ?? palette[0] ?? "Approved palette color",
          location: {
            slideId: slide.id,
            slideIndex: slide.index,
            shapeId: shape.id,
            shapeName: shape.name,
            textStart: range.start,
            textLength: range.length,
          },
          fixMode: rule.fixMode,
          suggestedFix: nearest
            ? {
                type: "set-font-color",
                safe: true,
                payload: {
                  color: nearest.hex,
                  textStart: range.start,
                  textLength: range.length,
                },
              }
            : undefined,
        });
      }
    }
  }

  return findings;
}

function isOffSlide(shape: ShapeSnapshot, width: number, height: number): boolean {
  const right = shape.left + shape.width;
  const bottom = shape.top + shape.height;
  return shape.left < 0 || shape.top < 0 || right > width || bottom > height;
}

function checkOffSlide(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["geometry.off-slide"];
  if (!rule?.enabled) return findings;

  const width = profile.layout?.slideWidth ?? snapshot.slideWidth;
  const height = profile.layout?.slideHeight ?? snapshot.slideHeight;

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      if (!shape.visible) continue;
      if (!isOffSlide(shape, width, height)) continue;
      findings.push({
        id: createFindingId("geometry.off-slide", slide.id, shape.id),
        ruleId: "geometry.off-slide",
        category: "Layout",
        severity: rule.severity,
        message: "Shape extends outside the slide bounds",
        actual: `${Math.round(shape.left)},${Math.round(shape.top)} ${Math.round(shape.width)}x${Math.round(shape.height)}`,
        expected: `Within 0,0 ${width}x${height}`,
        location: {
          slideId: slide.id,
          slideIndex: slide.index,
          shapeId: shape.id,
          shapeName: shape.name,
        },
        fixMode: rule.fixMode,
      });
    }
  }

  return findings;
}

function checkMissingAltText(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const rule = profile.rules["accessibility.missing-alt-text"];
  if (!rule?.enabled) return findings;
  if (!snapshot.apiSets.supported.includes("1.10")) return findings;

  for (const slide of snapshot.slides) {
    for (const shape of slide.shapes) {
      if (shape.type.toLowerCase() !== "image") continue;
      if (shape.isDecorative) continue;
      const alt = shape.altTextDescription?.trim() ?? shape.altTextTitle?.trim() ?? "";
      if (alt.length > 0 && alt.toLowerCase() !== "image") continue;
      findings.push({
        id: createFindingId("accessibility.missing-alt-text", slide.id, shape.id),
        ruleId: "accessibility.missing-alt-text",
        category: "Accessibility",
        severity: rule.severity,
        message: "Image is missing meaningful alt text",
        actual: alt || "Missing",
        expected: "Descriptive alt text or decorative flag",
        location: {
          slideId: slide.id,
          slideIndex: slide.index,
          shapeId: shape.id,
          shapeName: shape.name,
        },
        fixMode: rule.fixMode,
      });
    }
  }

  return findings;
}

const RULE_RUNNERS = [
  checkUnapprovedFonts,
  checkFontSize,
  checkDuplicateWords,
  checkWhitespace,
  checkEmptyText,
  checkUnapprovedTextColors,
  checkOffSlide,
  checkMissingAltText,
];

export function runPresentationCheck(
  snapshot: PresentationSnapshot,
  profile: BrandProfileConfiguration,
): import("./types").CheckResult {
  const findings = RULE_RUNNERS.flatMap((runner) => runner(snapshot, profile));

  const unsupportedRules = Object.entries(profile.rules)
    .filter(([ruleId, override]) => {
      if (!override.enabled) return false;
      if (ruleId === "accessibility.missing-alt-text") {
        return !snapshot.apiSets.supported.includes("1.10");
      }
      return false;
    })
    .map(([ruleId]) => ruleId);

  const summary = {
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warning").length,
    suggestions: findings.filter((finding) => finding.severity === "info").length,
    slidesScanned: snapshot.slides.length,
    shapesScanned: snapshot.slides.reduce((count, slide) => count + slide.shapes.length, 0),
    unsupportedRules,
  };

  return { findings, summary };
}
