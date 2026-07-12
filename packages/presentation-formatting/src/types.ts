export type FormattingActionId =
  | "align-left"
  | "align-center"
  | "align-right"
  | "align-top"
  | "align-middle"
  | "align-bottom"
  | "distribute-horizontal"
  | "distribute-vertical"
  | "match-width"
  | "match-height"
  | "match-both"
  | "stack-horizontal"
  | "stack-vertical"
  | "stack-bottom"
  | "stack-right"
  | "gap-exact-horizontal"
  | "gap-exact-vertical"
  | "gap-increase-horizontal"
  | "gap-decrease-horizontal"
  | "gap-increase-vertical"
  | "gap-decrease-vertical"
  | "gap-remove-horizontal"
  | "gap-remove-vertical"
  | "swap-positions"
  | "swap-top-left"
  | "swap-top-right"
  | "swap-bottom-left"
  | "swap-bottom-right"
  | "rectify-lines"
  | "set-bounds"
  | "text-autofit-none"
  | "text-autofit-shrink-text"
  | "text-autofit-resize-shape"
  | "text-margin-remove"
  | "text-margin-increase"
  | "text-margin-decrease"
  | "text-wrap-on"
  | "text-wrap-off"
  | "text-vertical-top"
  | "text-vertical-middle"
  | "text-vertical-bottom"
  | "swap-text";

export type Applicability =
  | { applicable: true }
  | { applicable: false; code: string; reason: string };

export type ApplicabilityPolicy = (selection: ShapeSelection) => Applicability;

export type RawBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
};

export type VisualBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type TextAutoSizeMode = "none" | "shrink-text" | "resize-shape";

export type TextVerticalAlignmentMode = "top" | "middle" | "bottom";

export type TextFrameSnapshot = {
  hasText: boolean;
  autoSizeSetting: TextAutoSizeMode;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  wordWrap: boolean;
  verticalAlignment: TextVerticalAlignmentMode;
  text: string;
};

export type ShapeCapabilities = {
  supportsBoundsMutation: boolean;
  supportsResize: boolean;
  supportsTextFrame: boolean;
  isLine: boolean;
};

export type SelectedShape = {
  id: string;
  name: string;
  type: string;
  selectionIndex: number;
  rawBounds: RawBounds;
  visualBounds: VisualBounds;
  capabilities: ShapeCapabilities;
  textFrame?: TextFrameSnapshot;
};

export type ShapeSelection = {
  slideId: string;
  shapes: SelectedShape[];
};

export type ShapeMutation = {
  shapeId: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rotation?: number;
  autoSizeSetting?: TextAutoSizeMode;
  leftMargin?: number;
  rightMargin?: number;
  topMargin?: number;
  bottomMargin?: number;
  wordWrap?: boolean;
  verticalAlignment?: TextVerticalAlignmentMode;
  text?: string;
};

export interface FormattingCommand<TParams = undefined> {
  readonly id: FormattingActionId;
  evaluate(selection: ShapeSelection, params?: TParams): Applicability;
  createPlan(selection: ShapeSelection, params?: TParams): ShapeMutation[];
}

export type AnyFormattingCommand = FormattingCommand<unknown>;

export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type DistributeAxis = "horizontal" | "vertical";
export type MatchSizeMode = "width" | "height" | "both";
export type StackDirection = "horizontal" | "vertical";
export type StackAnchor = "leading" | "trailing";
export type GapDirection = "horizontal" | "vertical";
export type GapMode = "exact" | "increase" | "decrease";
export type SwapAnchor = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type GapParams = {
  mode: GapMode;
  direction: GapDirection;
  value?: number;
};

export type SwapParams = {
  anchor: SwapAnchor;
};

export type SetBoundsParams = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
};

export const GEOMETRY_EPSILON = 0.01;
