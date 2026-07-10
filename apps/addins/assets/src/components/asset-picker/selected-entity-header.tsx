import type { SelectedAssetEntity } from "@/lib/asset-types";

import { AssetThumbnail } from "./asset-thumbnail";

interface SelectedEntityHeaderProps {
  entity: SelectedAssetEntity;
}

export function SelectedEntityHeader({ entity }: SelectedEntityHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <AssetThumbnail src={entity.icon} alt={entity.name} size={64} />

      <h2 className="text-[30px] font-semibold leading-[30px] tracking-[-0.01em] text-foreground">
        {entity.name}
      </h2>
    </div>
  );
}
