export function normalizeShapeType(type: string): string {
  return type.toLowerCase();
}

export function shapeSupportsTextFrame(type: string): boolean {
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

export function shapeSupportsFill(type: string): boolean {
  return normalizeShapeType(type) !== "line";
}

export function shapeIsLine(type: string): boolean {
  return normalizeShapeType(type) === "line";
}

export function shapeSupportsBoundsMutation(type: string): boolean {
  const normalized = normalizeShapeType(type);
  return !["group", "table", "chart", "smartart", "media", "unsupported"].includes(normalized);
}

export function shapeSupportsResize(type: string): boolean {
  return shapeSupportsBoundsMutation(type) && !shapeIsLine(type);
}

export function toShapeCapabilities(type: string) {
  return {
    supportsBoundsMutation: shapeSupportsBoundsMutation(type),
    supportsResize: shapeSupportsResize(type),
    isLine: shapeIsLine(type),
  };
}
