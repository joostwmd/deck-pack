import type {
  TextAutoSizeMode,
  TextFrameSnapshot,
  TextVerticalAlignmentMode,
} from "@deck-pack/shape-commands";

const OFFICE_AUTO_SIZE_TO_DOMAIN: Record<string, TextAutoSizeMode> = {
  AutoSizeNone: "none",
  AutoSizeTextToFitShape: "shrink-text",
  AutoSizeShapeToFitText: "resize-shape",
  AutoSizeMixed: "none",
};

const DOMAIN_AUTO_SIZE_TO_OFFICE: Record<TextAutoSizeMode, string> = {
  none: "AutoSizeNone",
  "shrink-text": "AutoSizeTextToFitShape",
  "resize-shape": "AutoSizeShapeToFitText",
};

const OFFICE_VERTICAL_ALIGNMENT_TO_DOMAIN: Record<string, TextVerticalAlignmentMode> = {
  Top: "top",
  TopCentered: "top",
  Middle: "middle",
  MiddleCentered: "middle",
  Bottom: "bottom",
  BottomCentered: "bottom",
};

const DOMAIN_VERTICAL_ALIGNMENT_TO_OFFICE: Record<TextVerticalAlignmentMode, string> = {
  top: "Top",
  middle: "MiddleCentered",
  bottom: "BottomCentered",
};

export function mapOfficeTextFrameSnapshot(input: {
  hasText: boolean;
  autoSizeSetting: string;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  wordWrap: boolean;
  verticalAlignment: string;
  text: string;
}): TextFrameSnapshot {
  return {
    hasText: input.hasText,
    autoSizeSetting: OFFICE_AUTO_SIZE_TO_DOMAIN[input.autoSizeSetting] ?? "none",
    leftMargin: input.leftMargin,
    rightMargin: input.rightMargin,
    topMargin: input.topMargin,
    bottomMargin: input.bottomMargin,
    wordWrap: input.wordWrap,
    verticalAlignment: OFFICE_VERTICAL_ALIGNMENT_TO_DOMAIN[input.verticalAlignment] ?? "top",
    text: input.text,
  };
}

export function mapDomainAutoSizeToOffice(mode: TextAutoSizeMode): string {
  return DOMAIN_AUTO_SIZE_TO_OFFICE[mode];
}

export function mapDomainVerticalAlignmentToOffice(mode: TextVerticalAlignmentMode): string {
  return DOMAIN_VERTICAL_ALIGNMENT_TO_OFFICE[mode];
}
