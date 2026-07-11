import type { AssetPanelMode } from "@/lib/asset-types";
import { isAppEnvironment } from "@/lib/navigation";

export function toAssetPanelMode(environment: string): AssetPanelMode {
  if (!isAppEnvironment(environment)) {
    throw new Error(`Invalid environment route parameter: ${environment}`);
  }

  return environment;
}
