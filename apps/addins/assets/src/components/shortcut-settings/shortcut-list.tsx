import { SHORTCUT_GROUPS } from "@deck-pack/shortcuts";
import { toast } from "sonner";

import { ShortcutListView } from "@/components/shortcut-settings/shortcut-list-view";
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

  const groups = SHORTCUT_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    shortcuts: getShortcutDefsByGroup(shortcuts, group.id).filter(
      (shortcut) => shortcut.id !== "openShortcuts",
    ),
  }));

  return (
    <ShortcutListView
      loadError={loadError}
      onRetry={retry}
      onEdit={onEdit}
      onResetAll={handleResetAll}
      groups={groups}
    />
  );
}

export { ShortcutListHeader } from "@/components/shortcut-settings/shortcut-list-view";
