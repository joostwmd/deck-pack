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
  | "gap-exact-horizontal"
  | "gap-exact-vertical"
  | "gap-increase-horizontal"
  | "gap-decrease-horizontal"
  | "gap-increase-vertical"
  | "gap-decrease-vertical"
  | "swap-positions"
  | "rectify-lines"
  | "set-bounds";

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

export type ShapeCapabilities = {
  supportsBoundsMutation: boolean;
  supportsResize: boolean;
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
};

export interface FormattingCommand<TParams = undefined> {
  readonly id: FormattingActionId;
  evaluate(selection: ShapeSelection, params: TParams): Applicability;
  createPlan(selection: ShapeSelection, params: TParams): ShapeMutation[];
}

export type AnyFormattingCommand = FormattingCommand<unknown>;

export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type DistributeAxis = "horizontal" | "vertical";
export type MatchSizeMode = "width" | "height" | "both";
export type StackDirection = "horizontal" | "vertical";
export type GapDirection = "horizontal" | "vertical";
export type GapMode = "exact" | "increase" | "decrease";

export type GapParams = {
  mode: GapMode;
  direction: GapDirection;
  value?: number;
};

export type SetBoundsParams = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
};

export const GEOMETRY_EPSILON = 0.01;
