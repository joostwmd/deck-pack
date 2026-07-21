export const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "Logos",
  flag: "Flags",
  icon: "Icons",
  harvey_ball: "Harvey balls",
  photo: "Photos",
  slide: "Slides",
  shape: "Shapes",
};

export function assetTypeLabel(assetType: string): string {
  return ASSET_TYPE_LABELS[assetType] ?? assetType;
}
