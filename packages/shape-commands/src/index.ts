export type {
  AlignMode,
  AnyFormattingCommand,
  Applicability,
  ApplicabilityPolicy,
  DistributeAxis,
  FormattingActionId,
  FormattingCommand,
  GapDirection,
  GapMode,
  GapParams,
  MatchSizeMode,
  RawBounds,
  SelectedShape,
  SetBoundsParams,
  ShapeCapabilities,
  ShapeMutation,
  ShapeSelection,
  StackAnchor,
  StackDirection,
  SwapAnchor,
  SwapParams,
  TextAutoSizeMode,
  TextFrameSnapshot,
  TextVerticalAlignmentMode,
  VisualBounds,
} from "./types";

export {
  composePolicies,
  evaluateApplicability,
  exactShapes,
  minShapes,
  onlyLines,
  sameSlide,
  supportsBoundsMutation,
  supportsResize,
  supportsTextFrame,
} from "./policies";

export {
  getVisualBounds,
  getVisualCenter,
  moveVisualCenterTo,
  normalizeRotation,
  setVisualHeight,
  setVisualLeft,
  setVisualTop,
  setVisualWidth,
  getSelectionVisualBounds,
} from "./geometry/bounds";

export { sortShapesHorizontally, sortShapesVertically } from "./geometry/sort";

export {
  alignBottomCommand,
  alignCenterCommand,
  alignCommands,
  alignLeftCommand,
  alignMiddleCommand,
  alignRightCommand,
  alignTopCommand,
  createAlignCommand,
} from "./commands/align";

export {
  createDistributeCommand,
  distributeCommands,
  distributeHorizontalCommand,
  distributeVerticalCommand,
} from "./commands/distribute";

export {
  createMatchSizeCommand,
  matchBothCommand,
  matchHeightCommand,
  matchSizeCommands,
  matchWidthCommand,
} from "./commands/match-size";

export {
  createStackCommand,
  stackBottomCommand,
  stackCommands,
  stackHorizontalCommand,
  stackRightCommand,
  stackVerticalCommand,
} from "./commands/stack";

export {
  createGapCommand,
  gapCommands,
  gapDecreaseHorizontalCommand,
  gapDecreaseVerticalCommand,
  gapExactHorizontalCommand,
  gapExactVerticalCommand,
  gapIncreaseHorizontalCommand,
  gapIncreaseVerticalCommand,
  gapRemoveHorizontalCommand,
  gapRemoveVerticalCommand,
} from "./commands/gap";

export {
  createSwapCommand,
  swapBottomLeftCommand,
  swapBottomRightCommand,
  swapCommands,
  swapPositionsCommand,
  swapTopLeftCommand,
  swapTopRightCommand,
} from "./commands/swap";

export {
  swapTextCommand,
  textAutofitNoneCommand,
  textAutofitResizeShapeCommand,
  textAutofitShrinkTextCommand,
  textCommands,
  textMarginDecreaseCommand,
  textMarginIncreaseCommand,
  textMarginRemoveCommand,
  textVerticalBottomCommand,
  textVerticalMiddleCommand,
  textVerticalTopCommand,
  textWrapOffCommand,
  textWrapOnCommand,
} from "./commands/text";

export { rectifyLinesCommand } from "./commands/rectify-lines";
export { setBoundsCommand } from "./commands/set-bounds";

export {
  formattingCommandRegistry,
  getFormattingCommandById,
  getUniqueFormattingCommandIds,
} from "./commands/registry";

export { GEOMETRY_EPSILON } from "./types";
