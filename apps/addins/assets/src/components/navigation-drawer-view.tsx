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
import type { ReactNode } from "react";

import { ShortcutKeys } from "@/components/shortcut-hint";
import type { KeyToken } from "@/lib/shortcuts";

export interface NavigationDrawerViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
  openMenuShortcutKeys: KeyToken[];
  children: ReactNode;
}

export interface NavigationDrawerPageButtonProps {
  label: string;
  isActive: boolean;
  shortcutKeys?: KeyToken[];
  onNavigate: () => void;
}

export function NavigationDrawerPageButton({
  label,
  isActive,
  shortcutKeys,
  onNavigate,
}: NavigationDrawerPageButtonProps) {
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
      <span className="font-medium">{label}</span>
      {shortcutKeys ? (
        <ShortcutKeys
          tokens={shortcutKeys}
          className="opacity-70 [&_kbd]:h-4 [&_kbd]:min-w-4 [&_kbd]:px-1 [&_kbd]:text-[10px]"
        />
      ) : null}
    </button>
  );
}

export function NavigationDrawerSectionView({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export function NavigationDrawerView({
  open,
  onOpenChange,
  showTrigger = true,
  openMenuShortcutKeys,
  children,
}: NavigationDrawerViewProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <div className="flex items-center gap-2">
          <ShortcutKeys
            tokens={openMenuShortcutKeys}
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

        <div className="flex flex-col gap-6 px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
