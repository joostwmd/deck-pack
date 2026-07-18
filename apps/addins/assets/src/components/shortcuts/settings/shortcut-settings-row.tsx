import { CaretRight } from "@phosphor-icons/react";
import { Badge } from "@deck-pack/ui/components/system/badge";
import { cn } from "@deck-pack/ui/lib/utils";

import { ShortcutKeys } from "@/components/shortcuts/shortcut-hint";
import type { ShortcutDef } from "@/lib/shortcuts";

interface ShortcutSettingsRowProps {
  def: ShortcutDef;
  onEdit: () => void;
}

export function ShortcutSettingsRow({ def, onEdit }: ShortcutSettingsRowProps) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted/50"
      onClick={onEdit}
    >
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{def.description}</span>

      <div className="flex shrink-0 items-center gap-2">
        {def.isCustomized ? (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            Custom
          </Badge>
        ) : null}
        <ShortcutKeys tokens={def.keys} />
        <CaretRight
          className="size-3.5 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100"
          aria-hidden
        />
      </div>
    </button>
  );
}

export function ShortcutSettingsSection({
  title,
  shortcuts,
  onEdit,
  className,
}: {
  title: string;
  shortcuts: ShortcutDef[];
  onEdit: (id: ShortcutDef["id"]) => void;
  className?: string;
}) {
  if (shortcuts.length === 0) return null;

  return (
    <section className={cn("flex flex-col gap-1", className)}>
      <h3 className="px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="flex flex-col">
        {shortcuts.map((shortcut) => (
          <ShortcutSettingsRow
            key={shortcut.id}
            def={shortcut}
            onEdit={() => onEdit(shortcut.id)}
          />
        ))}
      </div>
    </section>
  );
}
