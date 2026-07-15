import type { ObservedDeck } from "@deck-pack/agenda";

import { isPowerPointApiAvailable, runPowerPoint } from "../utils";

async function loadSlideTags(slide: PowerPoint.Slide): Promise<Record<string, string>> {
  try {
    slide.tags.load("items/key,value");
    await slide.context.sync();
    return Object.fromEntries(slide.tags.items.map((tag) => [tag.key, tag.value]));
  } catch {
    return {};
  }
}

async function loadShapeTags(shape: PowerPoint.Shape): Promise<Record<string, string>> {
  try {
    shape.tags.load("items/key,value");
    await shape.context.sync();
    return Object.fromEntries(shape.tags.items.map((tag) => [tag.key, tag.value]));
  } catch {
    return {};
  }
}

async function loadSlideTitle(slide: PowerPoint.Slide): Promise<string | null> {
  const shapes = slide.shapes;
  shapes.load("items/id,items/type");
  await slide.context.sync();

  for (const shape of shapes.items) {
    try {
      shape.load("textFrame/hasText,placeholderFormat/type");
      await slide.context.sync();
      if (!shape.textFrame?.hasText) continue;

      const placeholderType = String(shape.placeholderFormat?.type ?? "");
      if (!placeholderType.toLowerCase().includes("title")) {
        continue;
      }

      shape.textFrame.textRange.load("text");
      await slide.context.sync();
      return shape.textFrame.textRange.text?.trim() || null;
    } catch {
      continue;
    }
  }

  return null;
}

export async function scanAgendaDeck(): Promise<ObservedDeck> {
  if (!isPowerPointApiAvailable("1.4")) {
    throw new Error("Agenda scanning requires PowerPointApi 1.4 or later.");
  }

  return runPowerPoint(async (context) => {
    const slides = context.presentation.slides;
    const loadProperties = ["items/id"];
    if (isPowerPointApiAvailable("1.8")) {
      loadProperties.push("items/index");
    }
    slides.load(loadProperties.join(","));
    await context.sync();

    const observedSlides = [];
    const observedShapes = [];

    for (const [fallbackIndex, slide] of slides.items.entries()) {
      const tags = await loadSlideTags(slide);
      const title = await loadSlideTitle(slide);

      observedSlides.push({
        nativeSlideId: slide.id,
        index: isPowerPointApiAvailable("1.8") ? slide.index : fallbackIndex,
        title,
        tags,
      });

      slide.shapes.load("items/id");
      await context.sync();

      for (const shape of slide.shapes.items) {
        let text: string | null = null;
        try {
          shape.load("textFrame/hasText");
          await context.sync();
          if (shape.textFrame?.hasText) {
            shape.textFrame.textRange.load("text");
            await context.sync();
            text = shape.textFrame.textRange.text;
          }
        } catch {
          text = null;
        }

        observedShapes.push({
          nativeShapeId: shape.id,
          nativeSlideId: slide.id,
          text,
          tags: await loadShapeTags(shape),
        });
      }
    }

    return {
      slides: observedSlides,
      shapes: observedShapes,
    };
  });
}

export async function exportSlideAsBase64(slideId: string): Promise<string> {
  if (!isPowerPointApiAvailable("1.8")) {
    throw new Error("Template export requires PowerPointApi 1.8 or later.");
  }

  return runPowerPoint(async (context) => {
    const slide = context.presentation.slides.getItem(slideId);
    const result = slide.exportAsBase64();
    await context.sync();
    return result.value;
  });
}

export async function deleteSlideById(slideId: string): Promise<void> {
  if (!isPowerPointApiAvailable("1.2")) {
    throw new Error("Slide deletion requires PowerPointApi 1.2 or later.");
  }

  return runPowerPoint(async (context) => {
    context.presentation.slides.getItem(slideId).delete();
    await context.sync();
  });
}

export async function moveSlideToIndex(slideId: string, targetIndex: number): Promise<void> {
  if (!isPowerPointApiAvailable("1.8")) {
    throw new Error("Slide move requires PowerPointApi 1.8 or later.");
  }

  return runPowerPoint(async (context) => {
    context.presentation.slides.getItem(slideId).moveTo(targetIndex);
    await context.sync();
  });
}

export async function setShapeText(
  slideId: string,
  shapeId: string,
  text: string,
): Promise<void> {
  if (!isPowerPointApiAvailable("1.4")) {
    throw new Error("Text updates require PowerPointApi 1.4 or later.");
  }

  return runPowerPoint(async (context) => {
    const shape = context.presentation.slides.getItem(slideId).shapes.getItem(shapeId);
    shape.textFrame.textRange.text = text;
    await context.sync();
  });
}

export async function selectSlide(slideId: string): Promise<void> {
  if (!isPowerPointApiAvailable("1.5")) {
    throw new Error("Slide selection requires PowerPointApi 1.5 or later.");
  }

  return runPowerPoint(async (context) => {
    context.presentation.setSelectedSlides([slideId]);
    await context.sync();
  });
}
