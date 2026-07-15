import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@deck-pack/ui/components/system/button";
import { SHORTCUT_GROUPS } from "@deck-pack/shortcuts";
import { toast } from "sonner";

import { ResetShortcutsDialog } from "@/components/shortcut-settings/reset-shortcuts-dialog";
import { ShortcutRulesDialog } from "@/components/shortcut-settings/shortcut-rules-dialog";
import { ShortcutSettingsSection } from "@/components/shortcut-settings/shortcut-settings-row";
import { getShortcutDefsByGroup, type ShortcutId } from "@/lib/shortcuts";
import { useShortcutBindings } from "@/providers/shortcut-bindings-provider";

interface ShortcutListProps {
  onEdit: (shortcutId: ShortcutId) => void;
}

export function ShortcutList({ onEdit }: ShortcutListProps) {
  const { shortcuts, loadError, retry, resetAll } = useShortcutBindings();

  const handleResetAll = async () => {
    try {
      await resetAll();
      toast.success("All shortcuts reset to defaults");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset shortcuts");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {loadError ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
          <p>{loadError}</p>
          <button type="button" className="mt-1 font-medium underline" onClick={() => void retry()}>
            Retry
          </button>
        </div>
      ) : null}

      {SHORTCUT_GROUPS.map((group) => {
        const groupShortcuts = getShortcutDefsByGroup(shortcuts, group.id).filter(
          (shortcut) => shortcut.id !== "openShortcuts",
        );

        return (
          <ShortcutSettingsSection
            key={group.id}
            title={group.label}
            shortcuts={groupShortcuts}
            onEdit={onEdit}
          />
        );
      })}

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4">
        <ShortcutRulesDialog />
        <ResetShortcutsDialog onConfirm={handleResetAll} />
      </div>
    </div>
  );
}

export function ShortcutListHeader({ onBack }: { onBack?: () => void }) {
  if (!onBack) return null;

  return (
    <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
      <ArrowLeft className="size-4" />
      Back
    </Button>
  );
}
