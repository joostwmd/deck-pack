import { runPowerPoint } from "../utils";
import { shapeSupportsTextFrame } from "../selection/shape-capabilities";

export interface CapturedSelectionStyle {
  fontName: string | null;
  fontSize: number | null;
  fontColor: string | null;
  fillColor: string | null;
  outlineColor: string | null;
}

function normalizeColor(color: string | null | undefined): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  return trimmed;
}

export async function captureSelectedTextStyle(): Promise<CapturedSelectionStyle> {
  return runPowerPoint(async (context) => {
    const selection = context.presentation.getSelectedShapes();
    selection.load("items");
    await context.sync();

    if (selection.items.length === 0) {
      throw new Error("Select a shape or text box in PowerPoint first.");
    }

    const shape = selection.items[0]!;
    shape.load("type");
    await context.sync();

    let fontName: string | null = null;
    let fontSize: number | null = null;
    let fontColor: string | null = null;

    if (shapeSupportsTextFrame(String(shape.type))) {
      shape.load("textFrame/hasText,textFrame/textRange/font/name,textFrame/textRange/font/size,textFrame/textRange/font/color");
      await context.sync();

      if (shape.textFrame.hasText) {
        fontName = shape.textFrame.textRange.font.name;
        fontSize = shape.textFrame.textRange.font.size;
        fontColor = normalizeColor(shape.textFrame.textRange.font.color);
      }
    }

    let fillColor: string | null = null;
    let outlineColor: string | null = null;

    try {
      shape.fill.load("foregroundColor");
      shape.lineFormat.load("color");
      await context.sync();
      fillColor = normalizeColor(shape.fill.foregroundColor);
      outlineColor = normalizeColor(shape.lineFormat.color);
    } catch {
      // Some shapes do not expose fill or line formatting.
    }

    return {
      fontName,
      fontSize,
      fontColor,
      fillColor,
      outlineColor,
    };
  });
}
