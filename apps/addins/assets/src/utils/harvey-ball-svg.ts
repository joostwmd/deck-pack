export interface HarveyBallConfig {
  percentage: number;
  fillColor: string;
  backgroundColor: string;
  outlineColor: string;
  outlineWidth: number;
}

export type HarveyBallFillMode = "none" | "sector" | "full";

export interface HarveyBallGeometry {
  viewBox: string;
  center: number;
  radius: number;
  fillMode: HarveyBallFillMode;
  fillPath: string | null;
  backgroundCircle: {
    cx: number;
    cy: number;
    r: number;
  };
}

export interface HarveyBallValidationResult {
  valid: boolean;
  message?: string;
}

export const HARVEY_BALL_PRESETS = [0, 25, 50, 75, 100] as const;

export const DEFAULT_HARVEY_BALL_CONFIG: HarveyBallConfig = {
  percentage: 50,
  fillColor: "#111111",
  backgroundColor: "#ffffff",
  outlineColor: "#111111",
  outlineWidth: 2,
};

const VIEW_BOX = "0 0 100 100";
const CENTER = 50;
const RADIUS = 45;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function escapeXmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_PATTERN.test(color);
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleFromTopClockwise: number,
): { x: number; y: number } {
  const radians = ((angleFromTopClockwise - 90) * Math.PI) / 180;

  return {
    x: round(cx + radius * Math.cos(radians)),
    y: round(cy + radius * Math.sin(radians)),
  };
}

function createSectorPath(cx: number, cy: number, radius: number, percentage: number): string {
  const start = polarToCartesian(cx, cy, radius, 0);
  const end = polarToCartesian(cx, cy, radius, (percentage / 100) * 360);
  const largeArcFlag = percentage > 50 ? 1 : 0;

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function createFullCirclePath(cx: number, cy: number, radius: number): string {
  const left = round(cx - radius);
  const right = round(cx + radius);

  return `M ${left} ${cy} A ${radius} ${radius} 0 1 1 ${right} ${cy} A ${radius} ${radius} 0 1 1 ${left} ${cy} Z`;
}

export function normalizeHarveyBallConfig(config: Partial<HarveyBallConfig>): HarveyBallConfig {
  const percentage = Math.min(100, Math.max(0, Math.round(config.percentage ?? 0)));

  return {
    percentage,
    fillColor: config.fillColor ?? DEFAULT_HARVEY_BALL_CONFIG.fillColor,
    backgroundColor: config.backgroundColor ?? DEFAULT_HARVEY_BALL_CONFIG.backgroundColor,
    outlineColor: config.outlineColor ?? DEFAULT_HARVEY_BALL_CONFIG.outlineColor,
    outlineWidth: config.outlineWidth ?? DEFAULT_HARVEY_BALL_CONFIG.outlineWidth,
  };
}

export function validateHarveyBallConfig(config: HarveyBallConfig): HarveyBallValidationResult {
  if (config.percentage < 0 || config.percentage > 100) {
    return { valid: false, message: "Percentage must be between 0 and 100." };
  }

  if (config.outlineWidth < 0) {
    return { valid: false, message: "Outline width must be zero or greater." };
  }

  if (!isValidHexColor(config.fillColor)) {
    return { valid: false, message: "Fill color must be a valid hex color." };
  }

  if (!isValidHexColor(config.backgroundColor)) {
    return { valid: false, message: "Background color must be a valid hex color." };
  }

  if (!isValidHexColor(config.outlineColor)) {
    return { valid: false, message: "Outline color must be a valid hex color." };
  }

  return { valid: true };
}

export function createHarveyBallGeometry(config: HarveyBallConfig): HarveyBallGeometry {
  const normalized = normalizeHarveyBallConfig(config);

  let fillMode: HarveyBallFillMode = "none";
  let fillPath: string | null = null;

  if (normalized.percentage >= 100) {
    fillMode = "full";
    fillPath = createFullCirclePath(CENTER, CENTER, RADIUS);
  } else if (normalized.percentage > 0) {
    fillMode = "sector";
    fillPath = createSectorPath(CENTER, CENTER, RADIUS, normalized.percentage);
  }

  return {
    viewBox: VIEW_BOX,
    center: CENTER,
    radius: RADIUS,
    fillMode,
    fillPath,
    backgroundCircle: {
      cx: CENTER,
      cy: CENTER,
      r: RADIUS,
    },
  };
}

export function serializeHarveyBallSvg(config: HarveyBallConfig): string {
  const normalized = normalizeHarveyBallConfig(config);
  const geometry = createHarveyBallGeometry(normalized);

  const fillColor = escapeXmlAttribute(normalized.fillColor);
  const backgroundColor = escapeXmlAttribute(normalized.backgroundColor);
  const outlineColor = escapeXmlAttribute(normalized.outlineColor);
  const outlineWidth = round(normalized.outlineWidth);

  const fillElement =
    geometry.fillPath === null ? "" : `<path d="${geometry.fillPath}" fill="${fillColor}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.viewBox}" width="100" height="100" role="img" aria-label="Harvey ball ${normalized.percentage} percent"><circle cx="${geometry.backgroundCircle.cx}" cy="${geometry.backgroundCircle.cy}" r="${geometry.backgroundCircle.r}" fill="${backgroundColor}" stroke="${outlineColor}" stroke-width="${outlineWidth}" />${fillElement}</svg>`;
}

export function createHarveyBallMetadata(config: HarveyBallConfig): Record<string, string> {
  const normalized = normalizeHarveyBallConfig(config);

  return {
    TYPE: "HARVEY_BALL",
    PERCENTAGE: String(normalized.percentage),
    FILL_COLOR: normalized.fillColor,
    BACKGROUND_COLOR: normalized.backgroundColor,
    OUTLINE_COLOR: normalized.outlineColor,
    OUTLINE_WIDTH: String(normalized.outlineWidth),
  };
}
