import { POWERPOINT_API_LEVELS } from "../constants/requirement-sets";
import { isPowerPointApiAvailable } from "../utils";

export interface PowerPointCapabilitySummary {
  supported: string[];
  highest: string | null;
  baselineMet: boolean;
}

export function getPowerPointCapabilitySummary(): PowerPointCapabilitySummary {
  const supported = POWERPOINT_API_LEVELS.filter((level) => isPowerPointApiAvailable(level));
  const highest = supported.at(-1) ?? null;

  return {
    supported,
    highest,
    baselineMet: isPowerPointApiAvailable("1.4"),
  };
}
