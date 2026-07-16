import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AssetsShellView } from "@/features/assets-shell-view";
import { useNavigationHotkeys } from "@/hooks/use-navigation-hotkeys";
import type { AssetPanelMode } from "@/lib/asset-types";
import type { AppEnvironment } from "@/lib/navigation";
import { getPageRouteParams, getPageRouteTo } from "@/lib/navigation";

interface AssetsShellProps {
  mode: AssetPanelMode;
  children: ReactNode;
}

export function AssetsShell({ mode, children }: AssetsShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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
    <AssetsShellView
      environment={environment}
      isOffice={isOffice}
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      panelRef={panelRef}
      onPanelPointerDown={() => panelRef.current?.focus({ preventScroll: true })}
      onShortcutSettingsClick={() =>
        navigate({
          to: getPageRouteTo("shortcuts"),
          params: getPageRouteParams(environment),
        })
      }
    >
      {children}
    </AssetsShellView>
  );
}
