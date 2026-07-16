import { useNavigate, useRouterState } from "@tanstack/react-router";

import {
  NavigationDrawerPageButton,
  NavigationDrawerSectionView,
  NavigationDrawerView,
} from "@/components/navigation-drawer-view";
import { useResolvedShortcutDef } from "@/hooks/use-resolved-shortcut-defs";
import type { AppEnvironment } from "@/lib/navigation";
import {
  NAVIGATION_SECTIONS,
  getNavigationPagesBySection,
  getPageRouteParams,
  getPageRouteTo,
  type NavigationPage,
} from "@/lib/navigation";

interface NavigationDrawerProps {
  environment: AppEnvironment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
}

function NavigationDrawerPageWithShortcut({
  page,
  isActive,
  onNavigate,
}: {
  page: NavigationPage & { shortcut: NonNullable<NavigationPage["shortcut"]> };
  isActive: boolean;
  onNavigate: () => void;
}) {
  const shortcutDef = useResolvedShortcutDef(page.shortcut.id);

  return (
    <NavigationDrawerPageButton
      label={page.label}
      isActive={isActive}
      shortcutKeys={shortcutDef.keys}
      onNavigate={onNavigate}
    />
  );
}

export function NavigationDrawer({
  environment,
  open,
  onOpenChange,
  showTrigger = true,
}: NavigationDrawerProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentPage = pathname.split("/").filter(Boolean).at(-1);
  const openMenuShortcut = useResolvedShortcutDef("openMenu");

  const handleNavigate = (page: NavigationPage) => {
    navigate({
      to: getPageRouteTo(page.id),
      params: getPageRouteParams(environment),
    });
    onOpenChange(false);
  };

  return (
    <NavigationDrawerView
      open={open}
      onOpenChange={onOpenChange}
      showTrigger={showTrigger}
      openMenuShortcutKeys={openMenuShortcut.keys}
    >
      {NAVIGATION_SECTIONS.map((section) => {
        const pages = getNavigationPagesBySection(section.id);

        return (
          <NavigationDrawerSectionView key={section.id} label={section.label}>
            {pages.map((page) =>
              page.shortcut ? (
                <NavigationDrawerPageWithShortcut
                  key={page.id}
                  page={{ ...page, shortcut: page.shortcut }}
                  isActive={currentPage === page.path}
                  onNavigate={() => handleNavigate(page)}
                />
              ) : (
                <NavigationDrawerPageButton
                  key={page.id}
                  label={page.label}
                  isActive={currentPage === page.path}
                  onNavigate={() => handleNavigate(page)}
                />
              ),
            )}
          </NavigationDrawerSectionView>
        );
      })}
    </NavigationDrawerView>
  );
}
