import { useNavigate } from "@tanstack/react-router";

import { useShortcutCommands } from "@/hooks/use-shortcut-commands";
import type { AppEnvironment } from "@/constants/navigation";
import {
  getNavigationPagesWithShortcuts,
  getPageRouteParams,
  getPageRouteTo,
  type NavigationPageId,
} from "@/constants/navigation";

interface UseNavigationHotkeysOptions {
  environment: AppEnvironment;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}

export function useNavigationHotkeys({
  environment,
  onOpenMenu,
  onCloseMenu,
}: UseNavigationHotkeysOptions) {
  const navigate = useNavigate();

  const navigateToPage = (pageId: NavigationPageId) => {
    onCloseMenu();
    navigate({
      to: getPageRouteTo(pageId),
      params: getPageRouteParams(environment),
    });
  };

  useShortcutCommands([
    {
      id: "openMenu",
      execute: () => onOpenMenu(),
    },
    ...getNavigationPagesWithShortcuts()
      .filter((page) => page.shortcut != null)
      .map((page) => ({
        id: page.shortcut!.id,
        execute: () => navigateToPage(page.id),
      })),
    {
      id: "openShortcuts",
      execute: () => navigateToPage("shortcuts"),
    },
  ]);
}
