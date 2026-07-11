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
