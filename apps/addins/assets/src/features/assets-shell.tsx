import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { NavigationDrawer } from "@/components/navigation-drawer";
import { ShortcutSettingsButton } from "@/components/shortcut-settings/shortcut-settings-button";
import { ThemeSelector } from "@/components/theme-selector";
import { UserMenu } from "@/components/user-menu";
import { useNavigationHotkeys } from "@/hooks/use-navigation-hotkeys";
import type { AppEnvironment } from "@/lib/navigation";
import type { AssetPanelMode } from "@/lib/asset-types";

interface AssetsShellProps {
  mode: AssetPanelMode;
  children: ReactNode;
}

export function AssetsShell({ mode, children }: AssetsShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOffice = mode === "office";
  const environment: AppEnvironment = mode;

  useNavigationHotkeys({
    environment,
    onOpenMenu: () => setMenuOpen((open) => !open),
    onCloseMenu: () => setMenuOpen(false),
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
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-foreground">Deck Pack</p>
        </div>
        <NavigationDrawer
          environment={environment}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        />
      </header>

      <div className={cn("min-h-0 flex-1 overflow-y-auto", !isOffice && "mx-4")}>{children}</div>

      <footer className="flex shrink-0 items-center justify-between border-t px-4 py-3">
        <UserMenu environment={environment} />
        <div className="flex items-center gap-1">
          <ShortcutSettingsButton environment={environment} />
          <ThemeSelector />
        </div>
      </footer>
    </div>
  );
}
