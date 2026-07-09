import { Button } from "@deck-pack/ui/components/system/button";
import { cn } from "@deck-pack/ui/lib/utils";

export type AssetTab = "logos" | "flags" | "icons";

interface AssetTabsProps {
  activeTab: AssetTab;
  onTabChange: (tab: AssetTab) => void;
}

const tabs: { id: AssetTab; label: string }[] = [
  { id: "logos", label: "Logos" },
  { id: "flags", label: "Flags" },
  { id: "icons", label: "Icons" },
];

export function AssetTabs({ activeTab, onTabChange }: AssetTabsProps) {
  return (
    <div className="flex border-b px-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          variant="ghost"
          className={cn(
            "rounded-none border-b-2 border-transparent px-4 py-2",
            activeTab === tab.id && "border-primary text-primary",
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
