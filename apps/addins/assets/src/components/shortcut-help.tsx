import { Button } from "@deck-pack/ui/components/system/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@deck-pack/ui/components/system/sheet";
import { formatForDisplay } from "@tanstack/react-hotkeys";
import { Keyboard } from "@phosphor-icons/react";

import { ShortcutRow } from "@/components/shortcut-hint";
import { SHORTCUT_GROUPS, getShortcutsByGroup } from "@/lib/shortcuts";

interface ShortcutHelpProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function ShortcutHelp({ open, onOpenChange, showTrigger = true }: ShortcutHelpProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <SheetTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Keyboard shortcuts">
              <Keyboard className="size-4" />
            </Button>
          }
        />
      ) : null}

      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Keyboard shortcuts</SheetTitle>
          <SheetDescription>
            Navigate between pages without leaving the keyboard. Shortcuts are scoped to this
            panel and won&apos;t fire while typing in the search field unless noted.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {SHORTCUT_GROUPS.map((group) => {
            const shortcuts = getShortcutsByGroup(group.id);

            if (shortcuts.length === 0) {
              return null;
            }

            return (
              <section key={group.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </h3>

                <div className="flex flex-col gap-1">
                  {shortcuts.map((shortcut) => (
                    <ShortcutRow key={shortcut.id} def={shortcut} />
                  ))}
                </div>
              </section>
            );
          })}

          <p className="text-[11px] text-muted-foreground">
            Display uses your platform labels — e.g.{" "}
            <span className="font-mono">{formatForDisplay("Mod+Enter")}</span> on this device.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
