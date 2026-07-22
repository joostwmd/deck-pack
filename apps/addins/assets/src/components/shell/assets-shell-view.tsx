import { cn } from "@deck-pack/ui/lib/utils";
import { ThemeToggle } from "@deck-pack/ui/components/composite/theme-toggle";
import type { ReactNode, RefObject } from "react";

import { NavigationDrawer } from "@/components/shell/navigation-drawer";
import { ShortcutSettingsButton } from "@/components/shortcuts/settings/shortcut-settings-button";
import { UserMenu } from "@/components/shell/user-menu";
import type { AppEnvironment } from "@/constants/navigation";

export interface AssetsShellViewProps {
  environment: AppEnvironment;
  isOffice: boolean;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  panelRef: RefObject<HTMLDivElement | null>;
  onPanelPointerDown: () => void;
  onShortcutSettingsClick: () => void;
  children: ReactNode;
}

export function AssetsShellView({
  environment,
  isOffice,
  menuOpen,
  onMenuOpenChange,
  panelRef,
  onPanelPointerDown,
  onShortcutSettingsClick,
  children,
}: AssetsShellViewProps) {
  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="flex h-full min-h-0 flex-col overflow-hidden outline-none"
      onPointerDown={onPanelPointerDown}
    >
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-foreground">Deck Pack</p>
        </div>
        <NavigationDrawer
          environment={environment}
          open={menuOpen}
          onOpenChange={onMenuOpenChange}
        />
      </header>

      <div className={cn("min-h-0 flex-1 overflow-y-auto", !isOffice && "mx-4")}>{children}</div>

      <footer className="flex shrink-0 items-center justify-between border-t px-4 py-3">
        <UserMenu environment={environment} />
        <div className="flex items-center gap-1">
          <ShortcutSettingsButton onClick={onShortcutSettingsClick} />
          <ThemeToggle variant="enhanced" size="sm" />
        </div>
      </footer>
    </div>
  );
}
