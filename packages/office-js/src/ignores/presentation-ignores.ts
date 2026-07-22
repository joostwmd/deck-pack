import { runPowerPoint } from "../utils";

export const PRESENTATION_IGNORE_TAG = "deck-pack.check.ignore";

function parseIgnoreValue(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function safeSync(context: PowerPoint.RequestContext): Promise<boolean> {
  try {
    await context.sync();
    return true;
  } catch {
    return false;
  }
}

export async function loadPresentationIgnoreIds(): Promise<Set<string>> {
  return runPowerPoint(async (context) => {
    const presentation = context.presentation;
    presentation.load("slides/items/id");
    await context.sync();

    const ignored = new Set<string>();

    for (const slide of presentation.slides.items) {
      const shapes = slide.shapes;
      shapes.load("items/id");
      await context.sync();

      for (const shape of shapes.items) {
        shape.tags.load("items/key,value");
      }

      if (!(await safeSync(context))) {
        continue;
      }

      for (const shape of shapes.items) {
        for (const tag of shape.tags.items) {
          if (tag.key !== PRESENTATION_IGNORE_TAG) continue;
          for (const id of parseIgnoreValue(tag.value)) {
            ignored.add(id);
          }
        }
      }
    }

    return ignored;
  });
}

export async function persistFindingIgnoreForPresentation(
  findingId: string,
  location: { slideId: string; shapeId?: string },
): Promise<void> {
  if (!location.shapeId) {
    throw new Error("This issue cannot be ignored for the presentation without a target shape.");
  }

  return runPowerPoint(async (context) => {
    const slide = context.presentation.slides.getItem(location.slideId);
    const shape = slide.shapes.getItem(location.shapeId!);
    const tags = shape.tags;
    tags.load("items/key,value");
    await context.sync();

    const existing = tags.items.find((tag) => tag.key === PRESENTATION_IGNORE_TAG);
    const current = parseIgnoreValue(existing?.value);
    if (!current.includes(findingId)) {
      current.push(findingId);
    }

    if (existing) {
      existing.value = current.join(",");
    } else {
      tags.add(PRESENTATION_IGNORE_TAG, current.join(","));
    }

    await context.sync();
  });
}
