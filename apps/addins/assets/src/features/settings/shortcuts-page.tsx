import { useState } from "react";

import { ShortcutEditor } from "@/components/shortcut-settings/shortcut-editor";
import { ShortcutList } from "@/components/shortcut-settings/shortcut-list";
import type { ShortcutId } from "@/lib/shortcuts";

type ShortcutsView = { name: "list" } | { name: "edit"; shortcutId: ShortcutId };

export function ShortcutsPage() {
  const [view, setView] = useState<ShortcutsView>({ name: "list" });

  return (
    <div className="flex flex-col gap-4 p-4">
      {view.name === "list" ? (
        <>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">Shortcut settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Customize keyboard shortcuts for this add-in.
            </p>
          </div>
          <ShortcutList onEdit={(shortcutId) => setView({ name: "edit", shortcutId })} />
        </>
      ) : (
        <ShortcutEditor
          shortcutId={view.shortcutId}
          onBack={() => setView({ name: "list" })}
          onSaved={() => setView({ name: "list" })}
        />
      )}
    </div>
  );
}
