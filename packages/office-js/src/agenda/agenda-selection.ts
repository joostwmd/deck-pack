import { isPowerPointApiAvailable, runPowerPoint } from "../utils";

export type AgendaSelectedShape = {
  nativeShapeId: string;
  name: string;
  type: string;
  text: string | null;
  placeholderType: string | null;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type AgendaActiveSlide = {
  nativeSlideId: string;
  index: number;
  title: string | null;
};

export type AgendaSelectionSnapshot = {
  slide: AgendaActiveSlide | null;
  shapes: AgendaSelectedShape[];
};

async function loadSlideTitle(slide: PowerPoint.Slide): Promise<string | null> {
  const shapes = slide.shapes;
  shapes.load("items/id,items/type");
  await slide.context.sync();

  for (const shape of shapes.items) {
    if (!String(shape.type).toLowerCase().includes("placeholder")) {
      continue;
    }

    shape.load("placeholderFormat/type,textFrame/hasText");
    await slide.context.sync();

    if (!shape.textFrame?.hasText) {
      continue;
    }

    shape.textFrame.textRange.load("text");
    await slide.context.sync();

    const placeholderType = String(shape.placeholderFormat?.type ?? "");
    if (
      placeholderType.includes("title") ||
      placeholderType.includes("centerTitle") ||
      placeholderType.includes("verticalTitle")
    ) {
      return shape.textFrame.textRange.text?.trim() || null;
    }
  }

  return null;
}

export async function getAgendaSelectionSnapshot(): Promise<AgendaSelectionSnapshot> {
  if (!isPowerPointApiAvailable("1.4")) {
    throw new Error("Agenda selection requires PowerPointApi 1.4 or later.");
  }

  return runPowerPoint(async (context) => {
    const selectedSlides = context.presentation.getSelectedSlides();
    selectedSlides.load("items/id");
    await context.sync();

    if (selectedSlides.items.length === 0) {
      return { slide: null, shapes: [] };
    }

    const slide = selectedSlides.items[0]!;
    if (isPowerPointApiAvailable("1.8")) {
      slide.load("id,index");
    } else {
      slide.load("id");
    }
    await context.sync();

    const title = await loadSlideTitle(slide);
    const selection = context.presentation.getSelectedShapes();
    selection.load(
      "items/id,items/name,items/type,items/left,items/top,items/width,items/height",
    );
    await context.sync();

    const shapes: AgendaSelectedShape[] = [];
    for (const shape of selection.items) {
      let text: string | null = null;
      let placeholderType: string | null = null;

      try {
        shape.load("textFrame/hasText,placeholderFormat/type");
        await context.sync();
        placeholderType = shape.placeholderFormat?.type
          ? String(shape.placeholderFormat.type)
          : null;
        if (shape.textFrame?.hasText) {
          shape.textFrame.textRange.load("text");
          await context.sync();
          text = shape.textFrame.textRange.text;
        }
      } catch {
        text = null;
      }

      shapes.push({
        nativeShapeId: shape.id,
        name: shape.name,
        type: String(shape.type),
        text,
        placeholderType,
        left: shape.left,
        top: shape.top,
        width: shape.width,
        height: shape.height,
      });
    }

    return {
      slide: {
        nativeSlideId: slide.id,
        index: isPowerPointApiAvailable("1.8") ? slide.index : 0,
        title,
      },
      shapes,
    };
  });
}
