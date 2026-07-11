import type {
  PresentationSnapshot,
  ShapeSnapshot,
  SlideSnapshot,
  TextRangeSnapshot,
} from "@deck-pack/presentation-check";

import { MIN_ACCESSIBILITY_API, MIN_PLACEHOLDER_API, POWERPOINT_API_LEVELS } from "../constants/requirement-sets";
import { isPowerPointApiAvailable, runPowerPoint } from "../utils";

export type ScanProgress = {
  slidesProcessed: number;
  totalSlides: number;
  shapesProcessed: number;
  currentCategory: string;
};

export type ScanPresentationOptions = {
  slideIds?: string[];
  onProgress?: (progress: ScanProgress) => void;
  signal?: AbortSignal;
};

const DEFAULT_SLIDE_WIDTH = 960;
const DEFAULT_SLIDE_HEIGHT = 540;

type ShapeLoadContext = {
  includeAccessibility: boolean;
  includePlaceholder: boolean;
  includeVisible: boolean;
};

function getSupportedApiSets(): string[] {
  return POWERPOINT_API_LEVELS.filter((level) => isPowerPointApiAvailable(level));
}

function normalizeColor(color: string | null | undefined): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  return trimmed;
}

function normalizeShapeType(type: string): string {
  return type.toLowerCase();
}

function shapeSupportsTextFrame(type: string): boolean {
  const normalized = normalizeShapeType(type);
  return ![
    "image",
    "line",
    "group",
    "table",
    "chart",
    "smartart",
    "media",
    "unsupported",
  ].includes(normalized);
}

function shapeSupportsPlaceholderFormat(type: string): boolean {
  return normalizeShapeType(type).includes("placeholder");
}

function shapeSupportsFill(type: string): boolean {
  return normalizeShapeType(type) !== "line";
}

async function safeSync(context: PowerPoint.RequestContext): Promise<boolean> {
  try {
    await context.sync();
    return true;
  } catch {
    return false;
  }
}

function buildBaseShapeLoadProperties(context: ShapeLoadContext): string {
  const properties = ["id", "name", "type", "left", "top", "width", "height"];
  if (context.includeVisible) {
    properties.push("visible", "rotation");
  }
  if (context.includeAccessibility) {
    properties.push("altTextDescription", "altTextTitle", "isDecorative");
  }
  return properties.join(",");
}

async function loadShapeTags(shape: PowerPoint.Shape): Promise<Record<string, string>> {
  try {
    shape.tags.load("items/key,value");
    if (!(await safeSync(shape.context))) return {};
    return Object.fromEntries(shape.tags.items.map((tag) => [tag.key, tag.value]));
  } catch {
    return {};
  }
}

async function loadShapeText(
  shape: PowerPoint.Shape,
): Promise<{ text: string | null; textRanges: TextRangeSnapshot[] }> {
  if (!shapeSupportsTextFrame(String(shape.type))) {
    return { text: null, textRanges: [] };
  }

  try {
    shape.load("textFrame/hasText");
    shape.textFrame.textRange.load("text,start,length");
    shape.textFrame.textRange.font.load("name,size,bold,italic,color");
    if (!(await safeSync(shape.context))) {
      return { text: null, textRanges: [] };
    }

    if (!shape.textFrame.hasText) {
      return { text: null, textRanges: [] };
    }

    const range = shape.textFrame.textRange;
    return {
      text: range.text,
      textRanges: [
        {
          start: range.start ?? 0,
          length: range.length ?? range.text.length,
          text: range.text,
          fontName: range.font.name,
          fontSize: range.font.size,
          fontColor: normalizeColor(range.font.color),
          bold: range.font.bold,
          italic: range.font.italic,
        },
      ],
    };
  } catch {
    return { text: null, textRanges: [] };
  }
}

async function loadShapeFill(
  shape: PowerPoint.Shape,
): Promise<{
  fillColor: string | null;
  fillType: string | null;
  outlineColor: string | null;
  outlineVisible: boolean | null;
}> {
  if (!shapeSupportsFill(String(shape.type))) {
    return {
      fillColor: null,
      fillType: null,
      outlineColor: null,
      outlineVisible: null,
    };
  }

  try {
    shape.fill.load("type,foregroundColor,transparency");
    shape.lineFormat.load("color,visible");
    if (!(await safeSync(shape.context))) {
      return {
        fillColor: null,
        fillType: null,
        outlineColor: null,
        outlineVisible: null,
      };
    }

    return {
      fillColor: normalizeColor(shape.fill.foregroundColor),
      fillType: String(shape.fill.type),
      outlineColor: normalizeColor(shape.lineFormat.color),
      outlineVisible: shape.lineFormat.visible,
    };
  } catch {
    return {
      fillColor: null,
      fillType: null,
      outlineColor: null,
      outlineVisible: null,
    };
  }
}

async function loadPlaceholderType(
  shape: PowerPoint.Shape,
  context: ShapeLoadContext,
): Promise<string | null> {
  if (!context.includePlaceholder || !shapeSupportsPlaceholderFormat(String(shape.type))) {
    return null;
  }

  try {
    shape.load("placeholderFormat/type");
    if (!(await safeSync(shape.context))) return null;
    return shape.placeholderFormat.type;
  } catch {
    return null;
  }
}

async function loadShapeSnapshot(
  shape: PowerPoint.Shape,
  context: ShapeLoadContext,
): Promise<ShapeSnapshot | null> {
  shape.load(buildBaseShapeLoadProperties(context));
  if (!(await safeSync(shape.context))) {
    return null;
  }

  const tags = await loadShapeTags(shape);
  const textData = await loadShapeText(shape);
  const fillData = await loadShapeFill(shape);
  const placeholderType = await loadPlaceholderType(shape, context);

  return {
    id: shape.id,
    name: shape.name,
    type: String(shape.type),
    left: shape.left,
    top: shape.top,
    width: shape.width,
    height: shape.height,
    visible: context.includeVisible ? shape.visible : true,
    rotation: context.includeVisible ? shape.rotation : undefined,
    placeholderType,
    tags,
    text: textData.text,
    textRanges: textData.textRanges,
    fillColor: fillData.fillColor,
    fillType: fillData.fillType,
    outlineColor: fillData.outlineColor,
    outlineVisible: fillData.outlineVisible,
    altTextDescription: context.includeAccessibility ? shape.altTextDescription : null,
    altTextTitle: context.includeAccessibility ? shape.altTextTitle : null,
    isDecorative: context.includeAccessibility ? shape.isDecorative : null,
  };
}

export async function scanPresentation(
  options: ScanPresentationOptions = {},
): Promise<PresentationSnapshot> {
  if (!isPowerPointApiAvailable("1.4")) {
    throw new Error("Presentation scanning requires PowerPointApi 1.4 or later.");
  }

  const loadContext: ShapeLoadContext = {
    includeAccessibility: isPowerPointApiAvailable(MIN_ACCESSIBILITY_API),
    includePlaceholder: isPowerPointApiAvailable(MIN_PLACEHOLDER_API),
    includeVisible: isPowerPointApiAvailable(MIN_ACCESSIBILITY_API),
  };

  return runPowerPoint(async (context) => {
    const presentation = context.presentation;
    presentation.load("title,slides/items/id");
    await context.sync();

    let slideWidth = DEFAULT_SLIDE_WIDTH;
    let slideHeight = DEFAULT_SLIDE_HEIGHT;
    if (isPowerPointApiAvailable("1.10")) {
      presentation.load("pageSetup/slideWidth,pageSetup/slideHeight");
      if (await safeSync(context)) {
        slideWidth = presentation.pageSetup.slideWidth;
        slideHeight = presentation.pageSetup.slideHeight;
      }
    }

    const allSlides = presentation.slides;
    const slideLoadProperties = ["items/id", "items/layout/id", "items/layout/name"];
    if (isPowerPointApiAvailable("1.8")) {
      slideLoadProperties.push("items/index");
    }
    allSlides.load(slideLoadProperties.join(","));
    if (!(await safeSync(context))) {
      allSlides.load("items/id");
      await context.sync();
    }

    const selectedIds = options.slideIds ? new Set(options.slideIds) : null;
    const slidesToScan = allSlides.items.filter((slide) =>
      selectedIds ? selectedIds.has(slide.id) : true,
    );

    if (slidesToScan.length === 0) {
      throw new Error("No slides matched the selected scan scope.");
    }

    const slides: SlideSnapshot[] = [];
    let shapesProcessed = 0;

    for (const [index, slide] of slidesToScan.entries()) {
      if (options.signal?.aborted) {
        throw new Error("Scan cancelled");
      }

      options.onProgress?.({
        slidesProcessed: index,
        totalSlides: slidesToScan.length,
        shapesProcessed,
        currentCategory: `Slide ${index + 1}`,
      });

      const shapes = slide.shapes;
      shapes.load("items/id");
      await context.sync();

      const shapeSnapshots: ShapeSnapshot[] = [];
      for (const shape of shapes.items) {
        const snapshot = await loadShapeSnapshot(shape, loadContext);
        if (snapshot) {
          shapeSnapshots.push(snapshot);
        }
        shapesProcessed += 1;
      }

      slides.push({
        id: slide.id,
        index: isPowerPointApiAvailable("1.8") ? slide.index : index,
        layoutId: slide.layout?.id ?? null,
        layoutName: slide.layout?.name ?? null,
        shapes: shapeSnapshots,
      });
    }

    options.onProgress?.({
      slidesProcessed: slidesToScan.length,
      totalSlides: slidesToScan.length,
      shapesProcessed,
      currentCategory: "Complete",
    });

    return {
      title: presentation.title,
      slideWidth,
      slideHeight,
      slides,
      apiSets: {
        baseline: "1.5",
        supported: getSupportedApiSets(),
      },
    };
  });
}
