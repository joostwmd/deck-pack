/**
 * Rotation-aware visual bounds derived from Instrumenta ModuleObjects.bas (MIT, iappyx / o485).
 */
import type { RawBounds, VisualBounds } from "../types";

const DEG_TO_RAD = Math.PI / 180;

export function normalizeRotation(rotation: number): number {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function getVisualBounds(raw: RawBounds): VisualBounds {
  const rotation = normalizeRotation(raw.rotation);
  const radians = rotation * DEG_TO_RAD;
  const centerX = raw.left + raw.width / 2;
  const centerY = raw.top + raw.height / 2;

  if (rotation === 0 || rotation === 180) {
    return {
      left: raw.left,
      top: raw.top,
      width: raw.width,
      height: raw.height,
    };
  }

  if (rotation === 90 || rotation === 270) {
    return {
      left: centerX - raw.height / 2,
      top: centerY - raw.width / 2,
      width: raw.height,
      height: raw.width,
    };
  }

  const visualWidth =
    raw.width * Math.abs(Math.cos(radians)) + raw.height * Math.abs(Math.sin(radians));
  const visualHeight =
    raw.height * Math.abs(Math.cos(radians)) + raw.width * Math.abs(Math.sin(radians));

  return {
    left: centerX - visualWidth / 2,
    top: centerY - visualHeight / 2,
    width: visualWidth,
    height: visualHeight,
  };
}

export function getVisualCenter(raw: RawBounds): { x: number; y: number } {
  const bounds = getVisualBounds(raw);
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  };
}

export function setVisualLeft(raw: RawBounds, newLeft: number): RawBounds {
  const current = getVisualBounds(raw);
  const offset = newLeft - current.left;
  return { ...raw, left: raw.left + offset };
}

export function setVisualTop(raw: RawBounds, newTop: number): RawBounds {
  const current = getVisualBounds(raw);
  const offset = newTop - current.top;
  return { ...raw, top: raw.top + offset };
}

export function setVisualWidth(raw: RawBounds, newWidth: number): RawBounds {
  const rotation = normalizeRotation(raw.rotation);

  if (rotation === 0 || rotation === 180) {
    return { ...raw, width: newWidth };
  }

  if (rotation === 90 || rotation === 270) {
    return { ...raw, height: newWidth };
  }

  const radians = rotation * DEG_TO_RAD;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const denominator = cos * cos - sin * sin;

  if (Math.abs(denominator) < 1e-6) {
    return raw;
  }

  const rawWidth = (newWidth * cos - raw.height * sin) / denominator;
  return { ...raw, width: rawWidth };
}

export function setVisualHeight(raw: RawBounds, newHeight: number): RawBounds {
  const rotation = normalizeRotation(raw.rotation);

  if (rotation === 0 || rotation === 180) {
    return { ...raw, height: newHeight };
  }

  if (rotation === 90 || rotation === 270) {
    return { ...raw, width: newHeight };
  }

  const radians = rotation * DEG_TO_RAD;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const denominator = cos * cos - sin * sin;

  if (Math.abs(denominator) < 1e-6) {
    return raw;
  }

  const rawHeight = (newHeight * cos - raw.width * sin) / denominator;
  return { ...raw, height: rawHeight };
}

export function moveVisualCenterTo(raw: RawBounds, x: number, y: number): RawBounds {
  const currentCenter = getVisualCenter(raw);
  const deltaX = x - currentCenter.x;
  const deltaY = y - currentCenter.y;
  return {
    ...raw,
    left: raw.left + deltaX,
    top: raw.top + deltaY,
  };
}

export function rawBoundsToMutation(
  shapeId: string,
  before: RawBounds,
  after: RawBounds,
  epsilon = 0.01,
) {
  const mutation: {
    shapeId: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  } = {
    shapeId,
  };

  if (Math.abs(before.left - after.left) > epsilon) mutation.left = after.left;
  if (Math.abs(before.top - after.top) > epsilon) mutation.top = after.top;
  if (Math.abs(before.width - after.width) > epsilon) mutation.width = after.width;
  if (Math.abs(before.height - after.height) > epsilon) mutation.height = after.height;

  return Object.keys(mutation).length > 1 ? mutation : null;
}

export function getSelectionVisualBounds(shapes: Array<{ rawBounds: RawBounds }>): VisualBounds {
  const bounds = shapes.map((shape) => getVisualBounds(shape.rawBounds));
  const left = Math.min(...bounds.map((entry) => entry.left));
  const top = Math.min(...bounds.map((entry) => entry.top));
  const right = Math.max(...bounds.map((entry) => entry.left + entry.width));
  const bottom = Math.max(...bounds.map((entry) => entry.top + entry.height));

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}
