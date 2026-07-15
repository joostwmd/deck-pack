import { Button } from "@deck-pack/ui/components/system/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@deck-pack/ui/components/system/sheet";
import { cn } from "@deck-pack/ui/lib/utils";
import { List } from "@phosphor-icons/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { ShortcutKeys } from "@/components/shortcut-hint";
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

interface NavigationDrawerItemProps {
  page: NavigationPage;
  isActive: boolean;
  onNavigate: () => void;
}

function NavigationDrawerItem({ page, isActive, onNavigate }: NavigationDrawerItemProps) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent/60 hover:text-accent-foreground",
      )}
    >
      <span className="font-medium">{page.label}</span>
    </button>
  );
}

function NavigationDrawerItemWithShortcut({
  page,
  isActive,
  onNavigate,
}: NavigationDrawerItemProps & { page: NavigationPage & { shortcut: NonNullable<NavigationPage["shortcut"]> } }) {
  const shortcutDef = useResolvedShortcutDef(page.shortcut.id);

  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent/60 hover:text-accent-foreground",
      )}
    >
      <span className="font-medium">{page.label}</span>
      <ShortcutKeys
        tokens={shortcutDef.keys}
        className="opacity-70 [&_kbd]:h-4 [&_kbd]:min-w-4 [&_kbd]:px-1 [&_kbd]:text-[10px]"
      />
    </button>
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <div className="flex items-center gap-2">
          <ShortcutKeys
            tokens={openMenuShortcut.keys}
            className="opacity-70 [&_kbd]:h-4 [&_kbd]:min-w-4 [&_kbd]:px-1 [&_kbd]:text-[10px]"
          />
          <SheetTrigger
            render={
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Open navigation menu">
                <List className="size-4" />
              </Button>
            }
          />
        </div>
      ) : null}

      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Jump between asset libraries, utilities, and settings.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {NAVIGATION_SECTIONS.map((section) => {
            const pages = getNavigationPagesBySection(section.id);

            return (
              <section key={section.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {section.label}
                </h3>

                <div className="flex flex-col gap-1">
                  {pages.map((page) =>
                    page.shortcut ? (
                      <NavigationDrawerItemWithShortcut
                        key={page.id}
                        page={{ ...page, shortcut: page.shortcut }}
                        isActive={currentPage === page.path}
                        onNavigate={() => handleNavigate(page)}
                      />
                    ) : (
                      <NavigationDrawerItem
                        key={page.id}
                        page={page}
                        isActive={currentPage === page.path}
                        onNavigate={() => handleNavigate(page)}
                      />
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
