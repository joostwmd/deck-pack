import { useEffect, useRef, useState } from "react";

import { AssetTabs, type AssetTab } from "@/components/asset-tabs";
import { ShortcutHelp } from "@/components/shortcut-help";
import { FlagsPanel } from "@/features/flags/flags-panel";
import { IconsPanel } from "@/features/icons/icons-panel";
import { LogosPanel } from "@/features/logos/logos-panel";
import { useAssetTabHotkeys } from "@/hooks/use-asset-tab-hotkeys";
import type { AssetPanelMode } from "@/lib/asset-types";

interface AssetsShellProps {
  mode: AssetPanelMode;
}

export function AssetsShell({ mode }: AssetsShellProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>("logos");
  const [helpOpen, setHelpOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useAssetTabHotkeys({
    onTabChange: setActiveTab,
    onOpenHelp: () => setHelpOpen(true),
  });

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="flex h-full min-h-0 flex-col overflow-hidden outline-none"
      onPointerDown={() => panelRef.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center border-b pr-2">
        <AssetTabs activeTab={activeTab} onTabChange={setActiveTab} className="flex-1" />
        <ShortcutHelp open={helpOpen} onOpenChange={setHelpOpen} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {activeTab === "logos" && <LogosPanel mode={mode} />}
        {activeTab === "flags" && <FlagsPanel mode={mode} />}
        {activeTab === "icons" && <IconsPanel mode={mode} />}
      </div>
    </div>
  );
}
