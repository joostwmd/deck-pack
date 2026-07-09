import { Button } from "@deck-pack/ui/components/system/button";
import { Kbd, KbdGroup } from "@deck-pack/ui/components/system/kbd";
import { cn } from "@deck-pack/ui/lib/utils";

import { ShortcutKeys } from "@/components/shortcut-hint";
import { SHORTCUTS } from "@/lib/shortcuts";

export type AssetTab = "logos" | "flags" | "icons";

interface AssetTabsProps {
  activeTab: AssetTab;
  onTabChange: (tab: AssetTab) => void;
  className?: string;
}

const tabs = [
  { id: "logos" as const, label: "Logos", shortcut: SHORTCUTS.logos },
  { id: "flags" as const, label: "Flags", shortcut: SHORTCUTS.flags },
  { id: "icons" as const, label: "Icons", shortcut: SHORTCUTS.icons },
];

export function AssetTabs({ activeTab, onTabChange, className }: AssetTabsProps) {
  return (
    <div className={cn("flex border-b px-2", className)}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          variant="ghost"
          className={cn(
            "gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2",
            activeTab === tab.id && "border-primary text-primary",
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          <KbdGroup className="opacity-50">
            <ShortcutKeys tokens={tab.shortcut.keys} />
          </KbdGroup>
        </Button>
      ))}
    </div>
  );
}
