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
