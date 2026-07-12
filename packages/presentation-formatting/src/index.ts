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
  StackDirection,
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
  stackCommands,
  stackHorizontalCommand,
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
} from "./commands/gap";

export { swapPositionsCommand } from "./commands/swap";
export { rectifyLinesCommand } from "./commands/rectify-lines";
export { setBoundsCommand } from "./commands/set-bounds";

export {
  formattingCommandRegistry,
  getFormattingCommandById,
  getUniqueFormattingCommandIds,
} from "./commands/registry";

export { GEOMETRY_EPSILON } from "./types";
