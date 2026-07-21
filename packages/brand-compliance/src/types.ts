import type { FixMode, IssueSeverity } from "./profile";

export interface TextRangeSnapshot {
  start: number;
  length: number;
  text: string;
  fontName: string | null;
  fontSize: number | null;
  fontColor: string | null;
  bold: boolean | null;
  italic: boolean | null;
}

export interface ShapeSnapshot {
  id: string;
  name: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
  rotation?: number;
  placeholderType?: string | null;
  tags: Record<string, string>;
  text: string | null;
  textRanges: TextRangeSnapshot[];
  fillColor: string | null;
  fillType: string | null;
  outlineColor: string | null;
  outlineVisible: boolean | null;
  altTextDescription: string | null;
  altTextTitle: string | null;
  isDecorative: boolean | null;
}

export interface SlideSnapshot {
  id: string;
  index: number;
  layoutId: string | null;
  layoutName: string | null;
  shapes: ShapeSnapshot[];
}

export interface PresentationSnapshot {
  title: string | null;
  slideWidth: number;
  slideHeight: number;
  slides: SlideSnapshot[];
  apiSets: {
    baseline: string;
    supported: string[];
  };
}

export interface FindingLocation {
  slideId: string;
  slideIndex: number;
  shapeId?: string;
  shapeName?: string;
  textStart?: number;
  textLength?: number;
}

export interface SuggestedFix {
  type: string;
  safe: boolean;
  payload: Record<string, unknown>;
}

export interface CheckFinding {
  id: string;
  ruleId: string;
  category: string;
  severity: IssueSeverity;
  message: string;
  actual: string;
  expected: string;
  location: FindingLocation;
  fixMode: FixMode;
  suggestedFix?: SuggestedFix;
}

export interface CheckResult {
  findings: CheckFinding[];
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
    slidesScanned: number;
    shapesScanned: number;
    unsupportedRules: string[];
  };
}
