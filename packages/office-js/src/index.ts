export { OfficeClient, officeClient } from "./client";
export type {
  InsertImageOptions,
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
