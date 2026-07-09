export interface ShapePosition {
  left: number;
  top: number;
}

export interface ShapeSize {
  width: number;
  height: number;
}

export interface ShapeGeometry extends ShapePosition, ShapeSize {}

export interface InsertImageOptions extends Partial<ShapeGeometry> {}

export interface ShapeMetadata {
  [key: string]: string;
}

export interface OfficeReadyInfo {
  host: Office.HostType;
  platform: Office.PlatformType;
}
