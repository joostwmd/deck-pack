import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@deck-pack/ui/components/system/tabs";
import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

import { ShortcutHelp } from "@/components/shortcut-help";
import { ShortcutKeys } from "@/components/shortcut-hint";
import { ThemeSelector } from "@/components/theme-selector";
import { UserMenu } from "@/components/user-menu";
import { FlagsPanel } from "@/features/flags/flags-panel";
import { HarveyBallsPanel } from "@/features/harvey-balls/harvey-balls-panel";
import { IconsPanel } from "@/features/icons/icons-panel";
import { LogosPanel } from "@/features/logos/logos-panel";
import { PhotosPanel } from "@/features/photos/photos-panel";
import { useAssetTabHotkeys } from "@/hooks/use-asset-tab-hotkeys";
import type { AssetPanelMode, AssetTab } from "@/lib/asset-types";
import { SHORTCUTS } from "@/lib/shortcuts";

const tabs = [
  { id: "logos" as const, label: "Logos", shortcut: SHORTCUTS.logos },
  { id: "flags" as const, label: "Flags", shortcut: SHORTCUTS.flags },
  { id: "icons" as const, label: "Icons", shortcut: SHORTCUTS.icons },
  { id: "images" as const, label: "Images", shortcut: SHORTCUTS.images },
  { id: "harvey-balls" as const, label: "Balls", shortcut: SHORTCUTS.harveyBalls },
];

interface AssetsShellProps {
  mode: AssetPanelMode;
}

export function AssetsShell({ mode }: AssetsShellProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>("logos");
  const [helpOpen, setHelpOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOffice = mode === "office";

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
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AssetTab)}
        className="flex h-full min-h-0 w-full flex-col gap-2"
      >
        <TabsList className="mx-4 mt-4 w-[calc(100%-2rem)] gap-1 px-2 py-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              shortcut={
                <ShortcutKeys
                  tokens={tab.shortcut.keys}
                  className="opacity-60 [&_kbd]:h-4 [&_kbd]:min-w-4 [&_kbd]:px-1 [&_kbd]:text-[10px] [&_svg]:size-2.5"
                />
              }
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          value="logos"
          className={cn("min-h-0 flex-1 overflow-y-auto", !isOffice && "mx-4")}
        >
          {activeTab === "logos" ? <LogosPanel mode={mode} /> : null}
        </TabsContent>
        <TabsContent
          value="flags"
          className={cn("min-h-0 flex-1 overflow-y-auto", !isOffice && "mx-4")}
        >
          {activeTab === "flags" ? <FlagsPanel mode={mode} /> : null}
        </TabsContent>
        <TabsContent
          value="icons"
          className={cn("min-h-0 flex-1 overflow-y-auto", !isOffice && "mx-4")}
        >
          {activeTab === "icons" ? <IconsPanel mode={mode} /> : null}
        </TabsContent>
        <TabsContent
          value="images"
          className={cn("min-h-0 flex-1 overflow-y-auto", !isOffice && "mx-4")}
        >
          {activeTab === "images" ? <PhotosPanel mode={mode} /> : null}
        </TabsContent>
        <TabsContent
          value="harvey-balls"
          className={cn("min-h-0 flex-1 overflow-y-auto", !isOffice && "mx-4")}
        >
          {activeTab === "harvey-balls" ? <HarveyBallsPanel mode={mode} /> : null}
        </TabsContent>

        <footer className="flex shrink-0 items-center justify-between border-t px-4 py-3">
          <UserMenu />
          <div className="flex items-center gap-1">
            <ShortcutHelp open={helpOpen} onOpenChange={setHelpOpen} />
            <ThemeSelector />
          </div>
        </footer>
      </Tabs>
    </div>
  );
}
