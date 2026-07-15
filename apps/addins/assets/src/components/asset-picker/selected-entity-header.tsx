import type { SelectedAssetEntity } from "@/lib/asset-types";

import { AssetThumbnail } from "./asset-thumbnail";

interface SelectedEntityHeaderProps {
  entity: SelectedAssetEntity;
}

export function SelectedEntityHeader({ entity }: SelectedEntityHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <AssetThumbnail src={entity.icon} alt="" size={48} />

      <h2 className="min-w-0 truncate text-xl font-semibold leading-6 tracking-[-0.01em] text-foreground">
        {entity.name}
      </h2>
    </div>
  );
}
