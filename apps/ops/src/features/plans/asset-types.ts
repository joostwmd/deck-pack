export const PLAN_ASSET_TYPES = [
  "logo",
  "flag",
  "icon",
  "harvey_ball",
  "photo",
  "slide",
  "shape",
] as const;

export type PlanAssetType = (typeof PLAN_ASSET_TYPES)[number];

const LABELS: Record<PlanAssetType, string> = {
  logo: "Logos",
  flag: "Flags",
  icon: "Icons",
  harvey_ball: "Harvey balls",
  photo: "Photos",
  slide: "Slides",
  shape: "Shapes",
};

/** Short labels for dense table headers. */
const SHORT_LABELS: Record<PlanAssetType, string> = {
  logo: "Logo",
  flag: "Flag",
  icon: "Icon",
  harvey_ball: "Harvey",
  photo: "Photo",
  slide: "Slide",
  shape: "Shape",
};

export function planAssetTypeLabel(assetType: PlanAssetType | string): string {
  if (assetType in LABELS) {
    return LABELS[assetType as PlanAssetType];
  }
  return assetType;
}

export function planAssetTypeShortLabel(assetType: PlanAssetType | string): string {
  if (assetType in SHORT_LABELS) {
    return SHORT_LABELS[assetType as PlanAssetType];
  }
  return assetType;
}

export function defaultPlanLimitValues(): Record<PlanAssetType, string> {
  return {
    logo: "100",
    flag: "100",
    icon: "100",
    harvey_ball: "100",
    photo: "100",
    slide: "100",
    shape: "100",
  };
}

export function defaultPlanUnlimitedFlags(): Record<PlanAssetType, boolean> {
  return {
    logo: false,
    flag: false,
    icon: false,
    harvey_ball: false,
    photo: false,
    slide: false,
    shape: false,
  };
}

export function formatInsertLimit(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "∞";
  }
  return value.toLocaleString();
}
