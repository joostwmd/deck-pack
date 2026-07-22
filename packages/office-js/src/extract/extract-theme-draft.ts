import type { BrandProfileConfiguration } from "@deck-pack/brand-compliance";
import { DEFAULT_BRAND_PROFILE_CONFIGURATION } from "@deck-pack/brand-compliance";

import { scanPresentation } from "../snapshot/scan-presentation";

export interface ExtractedThemeDraft {
  suggestedName: string;
  configuration: BrandProfileConfiguration;
  observations: {
    headingFonts: Array<{ font: string; count: number }>;
    bodyFonts: Array<{ font: string; count: number }>;
    colors: Array<{ color: string; count: number }>;
  };
}

function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export async function extractThemeDraftFromPresentation(): Promise<ExtractedThemeDraft> {
  const snapshot = await scanPresentation();
  const fonts = snapshot.slides.flatMap((slide) =>
    slide.shapes.flatMap((shape) => shape.textRanges.map((range) => range)),
  );
  const colors = snapshot.slides.flatMap((slide) =>
    slide.shapes.flatMap((shape) => [
      ...shape.textRanges.map((range) => range.fontColor),
      shape.fillColor,
      shape.outlineColor,
    ]),
  );

  const headingFonts = countBy(
    snapshot.slides.flatMap((slide) => slide.shapes),
    (shape) =>
      shape.placeholderType?.toLowerCase().includes("title")
        ? (shape.textRanges[0]?.fontName ?? null)
        : null,
  ).map(({ value, count }) => ({ font: value, count }));

  const bodyFonts = countBy(fonts, (range) => range.fontName).map(({ value, count }) => ({
    font: value,
    count,
  }));

  const paletteColors = countBy(colors, (color) => color)
    .filter((entry) => entry.value.startsWith("#"))
    .slice(0, 6)
    .map(({ value, count }, index) => ({
      color: value,
      count,
      id: `extracted-${index + 1}`,
      name: `Extracted ${index + 1}`,
    }));

  const configuration: BrandProfileConfiguration = {
    ...DEFAULT_BRAND_PROFILE_CONFIGURATION,
    typography: {
      roles: {
        title: {
          allowedFonts: headingFonts[0] ? [headingFonts[0].font] : ["Calibri"],
          minimumSize: 24,
          maximumSize: 44,
        },
        body: {
          allowedFonts: bodyFonts[0] ? [bodyFonts[0].font] : ["Calibri"],
          minimumSize: 12,
          maximumSize: 24,
        },
      },
      fallbackFonts: ["Arial"],
    },
    colors: {
      palette: paletteColors.map((entry) => ({
        id: entry.id,
        name: entry.name,
        hex: entry.color,
        roles: ["text", "fill", "outline"],
      })),
      maximumColorDistance: 12,
      allowTintsAndShades: true,
    },
    layout: {
      slideWidth: snapshot.slideWidth,
      slideHeight: snapshot.slideHeight,
    },
  };

  return {
    suggestedName: snapshot.title?.trim() || "Imported theme",
    configuration,
    observations: {
      headingFonts,
      bodyFonts,
      colors: paletteColors.map(({ color, count }) => ({ color, count })),
    },
  };
}
