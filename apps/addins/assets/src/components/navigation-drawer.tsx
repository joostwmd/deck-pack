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
import type { AppEnvironment } from "@/lib/navigation";
import { SHORTCUTS } from "@/lib/shortcuts";
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

function NavigationDrawerItem({
  page,
  environment,
  isActive,
  onNavigate,
}: {
  page: NavigationPage;
  environment: AppEnvironment;
  isActive: boolean;
  onNavigate: () => void;
}) {
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
        tokens={page.shortcut.keys}
        className="opacity-70 [&_kbd]:h-4 [&_kbd]:min-w-4 [&_kbd]:px-1 [&_kbd]:text-[10px] [&_svg]:size-2.5"
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
            tokens={SHORTCUTS.openMenu.keys}
            className="opacity-70 [&_kbd]:h-4 [&_kbd]:min-w-4 [&_kbd]:px-1 [&_kbd]:text-[10px] [&_svg]:size-2.5"
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
            Jump between asset libraries and presentation utilities.
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
                  {pages.map((page) => (
                    <NavigationDrawerItem
                      key={page.id}
                      page={page}
                      environment={environment}
                      isActive={currentPage === page.path}
                      onNavigate={() => handleNavigate(page)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
