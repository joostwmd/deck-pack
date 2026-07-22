export const POWERPOINT_API_LEVELS = ["1.2", "1.3", "1.4", "1.5", "1.8", "1.9", "1.10"] as const;

export type PowerPointApiLevel = (typeof POWERPOINT_API_LEVELS)[number];

export const MIN_SCAN_API: PowerPointApiLevel = "1.5";
export const MIN_TEXT_API: PowerPointApiLevel = "1.4";
export const MIN_PLACEHOLDER_API: PowerPointApiLevel = "1.8";
export const MIN_ACCESSIBILITY_API: PowerPointApiLevel = "1.10";
