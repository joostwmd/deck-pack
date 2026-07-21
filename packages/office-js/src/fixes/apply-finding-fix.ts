import type { CheckFinding } from "@deck-pack/brand-compliance";

import { runPowerPoint } from "../utils";

export async function applyFindingFix(finding: CheckFinding): Promise<void> {
  if (!finding.suggestedFix || !finding.location.shapeId) {
    throw new Error("This issue cannot be fixed automatically.");
  }

  const { slideId, shapeId, textStart, textLength } = finding.location;
  const fix = finding.suggestedFix;

  return runPowerPoint(async (context) => {
    const slide = context.presentation.slides.getItem(slideId);
    const shape = slide.shapes.getItem(shapeId!);
    const textFrame = shape.textFrame;

    switch (fix.type) {
      case "set-font-name": {
        const range = getTargetRange(textFrame, textStart, textLength);
        range.font.name = String(fix.payload.fontName);
        break;
      }
      case "set-font-color": {
        const range = getTargetRange(textFrame, textStart, textLength);
        range.font.color = String(fix.payload.color);
        break;
      }
      case "replace-text-range": {
        const range = getTargetRange(textFrame, textStart, textLength);
        range.text = String(fix.payload.replacement);
        break;
      }
      case "normalize-whitespace":
      case "trim-text": {
        textFrame.textRange.load("text");
        await context.sync();
        let next = textFrame.textRange.text;
        if (fix.type === "normalize-whitespace") {
          next = next.replace(/\s{2,}/g, " ");
        }
        if (fix.type === "trim-text") {
          next = next.trim();
        }
        textFrame.textRange.text = next;
        break;
      }
      default:
        throw new Error(`Unsupported fix type: ${fix.type}`);
    }

    await context.sync();
  });
}

function getTargetRange(
  textFrame: PowerPoint.TextFrame,
  textStart?: number,
  textLength?: number,
): PowerPoint.TextRange {
  if (textStart == null) {
    return textFrame.textRange;
  }
  return textFrame.textRange.getSubstring(textStart, textLength ?? undefined);
}
