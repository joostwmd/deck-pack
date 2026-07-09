import { useState } from "react";

import { AssetTabs, type AssetTab } from "@/components/asset-tabs";
import { FlagsPanel } from "@/features/flags/flags-panel";
import { IconsPanel } from "@/features/icons/icons-panel";
import { LogosPanel } from "@/features/logos/logos-panel";
import type { AssetPanelMode } from "@/lib/asset-types";

interface AssetsShellProps {
  mode: AssetPanelMode;
}

export function AssetsShell({ mode }: AssetsShellProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>("logos");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <AssetTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {activeTab === "logos" && <LogosPanel mode={mode} />}
        {activeTab === "flags" && <FlagsPanel mode={mode} />}
        {activeTab === "icons" && <IconsPanel mode={mode} />}
      </div>
    </div>
  );
}
