import { useHotkeys } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";

import type { AppEnvironment } from "@/lib/navigation";
import {
  NAVIGATION_PAGES,
  getPageRouteParams,
  getPageRouteTo,
  type NavigationPageId,
} from "@/lib/navigation";
import { SHORTCUTS } from "@/lib/shortcuts";

interface UseNavigationHotkeysOptions {
  environment: AppEnvironment;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onOpenHelp: () => void;
}

export function useNavigationHotkeys({
  environment,
  onOpenMenu,
  onCloseMenu,
  onOpenHelp,
}: UseNavigationHotkeysOptions) {
  const navigate = useNavigate();

  const navigateToPage = (pageId: NavigationPageId) => {
    onCloseMenu();
    navigate({
      to: getPageRouteTo(pageId),
      params: getPageRouteParams(environment),
    });
  };

  useHotkeys([
    {
      hotkey: SHORTCUTS.openMenu.hotkey,
      callback: () => onOpenMenu(),
      options: {
        meta: { name: SHORTCUTS.openMenu.id, description: SHORTCUTS.openMenu.description },
      },
    },
    ...NAVIGATION_PAGES.map((page) => ({
      hotkey: page.shortcut.hotkey,
      callback: () => navigateToPage(page.id),
      options: {
        meta: { name: page.shortcut.id, description: page.shortcut.description },
      },
    })),
    {
      hotkey: SHORTCUTS.openHelp.hotkey,
      callback: () => onOpenHelp(),
      options: {
        meta: { name: SHORTCUTS.openHelp.id, description: SHORTCUTS.openHelp.description },
      },
    },
  ]);
}
