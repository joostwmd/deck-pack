import type { AssetPanelMode } from "@/types/asset-types";
import { isAppEnvironment } from "@/constants/navigation";

export function toAssetPanelMode(environment: string): AssetPanelMode {
  if (!isAppEnvironment(environment)) {
    throw new Error(`Invalid environment route parameter: ${environment}`);
  }

  return environment;
}
