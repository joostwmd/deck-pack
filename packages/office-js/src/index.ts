export { OfficeClient, officeClient } from "./client";
export type {
  InsertImageOptions,
  InsertSlidesOptions,
  OfficeReadyInfo,
  ShapeGeometry,
  ShapeMetadata,
  ShapePosition,
  ShapeSize,
} from "./types";
export {
  detectOffice,
  getOfficeReadyInfo,
  isOfficeDocumentAvailable,
  isOfficeReady,
  isPowerPointApiAvailable,
  runOfficeAsync,
  runPowerPoint,
} from "./utils";
export { scanPresentation } from "./snapshot/scan-presentation";
export type { ScanProgress, ScanPresentationOptions } from "./snapshot/scan-presentation";
export { navigateToFinding } from "./navigation/navigate-to-finding";
export { applyFindingFix } from "./fixes/apply-finding-fix";
export { extractThemeDraftFromPresentation } from "./extract/extract-theme-draft";
export type { ExtractedThemeDraft } from "./extract/extract-theme-draft";
export { captureSelectedTextStyle } from "./capture/capture-selection-style";
export type { CapturedSelectionStyle } from "./capture/capture-selection-style";
export {
  loadPresentationIgnoreIds,
  persistFindingIgnoreForPresentation,
  PRESENTATION_IGNORE_TAG,
} from "./ignores/presentation-ignores";
export { getPowerPointCapabilitySummary } from "./capabilities/get-capability-summary";
export type { PowerPointCapabilitySummary } from "./capabilities/get-capability-summary";
export {
  MIN_ACCESSIBILITY_API,
  MIN_PLACEHOLDER_API,
  MIN_SCAN_API,
  MIN_TEXT_API,
  POWERPOINT_API_LEVELS,
} from "./constants/requirement-sets";
export { readSelectedShapes } from "./selection/read-selected-shapes-api";
export { subscribeToSelectionChanges } from "./selection/subscribe-selection-changes";
export type { OfficeContextPort, SelectionSubscription } from "./selection/subscribe-selection-changes";
export {
  shapeIsLine,
  shapeSupportsBoundsMutation,
  shapeSupportsFill,
  shapeSupportsResize,
  shapeSupportsTextFrame,
  toShapeCapabilities,
} from "./selection/shape-capabilities";
export { executeFormattingCommand } from "./format/execute-formatting-command";
export type { FormattingExecutionResult } from "./format/execute-formatting-command";
export {
  FormattingExecutionError,
  FormattingUnavailableError,
} from "./format/formatting-errors";
export {
  loadDocumentSetting,
  removeDocumentSetting,
  saveDocumentSetting,
} from "./settings/document-settings";
export {
  clearAgendaConfig,
  loadAgendaConfig,
  persistAgendaConfig,
} from "./agenda/agenda-settings";
export type { AgendaSettingsState } from "./agenda/agenda-settings";
export {
  buildAgendaShapeTags,
  buildAgendaSlideTags,
  tagPresentation,
  tagShape,
  tagSlide,
} from "./agenda/agenda-tags";
export {
  getAgendaSelectionSnapshot,
} from "./agenda/agenda-selection";
export type {
  AgendaActiveSlide,
  AgendaSelectedShape,
  AgendaSelectionSnapshot,
} from "./agenda/agenda-selection";
export {
  deleteSlideById,
  exportSlideAsBase64,
  moveSlideToIndex,
  scanAgendaDeck,
  selectSlide,
  setShapeText,
} from "./agenda/scan-agenda-deck";
export {
  applyAgendaUpdatePlan,
  buildTemplateMapping,
  createInitialAgendaConfig,
  updateAgendaFromDraft,
  validateTemplateMappingDraft,
} from "./agenda/apply-agenda-update";
export type { TemplateMappingDraft } from "./agenda/apply-agenda-update";
