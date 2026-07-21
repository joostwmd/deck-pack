import type { FindingLocation } from "@deck-pack/brand-compliance";

import { runPowerPoint } from "../utils";

export async function navigateToFinding(location: FindingLocation): Promise<void> {
  return runPowerPoint(async (context) => {
    context.presentation.setSelectedSlides([location.slideId]);
    await context.sync();

    if (!location.shapeId) {
      return;
    }

    const slide = context.presentation.slides.getItem(location.slideId);
    slide.setSelectedShapes([location.shapeId]);
    await context.sync();

    if (location.textStart == null) {
      return;
    }

    const shape = slide.shapes.getItem(location.shapeId);
    const textFrame = shape.textFrame;
    textFrame.textRange.load("text");
    await context.sync();

    const substring = textFrame.textRange.getSubstring(
      location.textStart,
      location.textLength ?? undefined,
    );
    substring.setSelected();
    await context.sync();
  });
}
