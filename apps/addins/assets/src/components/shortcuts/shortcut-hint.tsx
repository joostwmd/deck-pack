import { Kbd, KbdGroup } from "@deck-pack/ui/components/system/kbd";
import { cn } from "@deck-pack/ui/lib/utils";

import type { KeyToken, ShortcutDef } from "@/utils/shortcuts";

const shortcutKbdClassName =
  "min-w-5.5 rounded-sm border-[0.5px] border-border px-1.5 text-xs font-medium text-foreground shadow-xs";

function ShortcutKey({ token }: { token: KeyToken }) {
  return <Kbd className={shortcutKbdClassName}>{token.value}</Kbd>;
}

export function ShortcutKeys({ tokens, className }: { tokens: KeyToken[]; className?: string }) {
  return (
    <KbdGroup className={cn("pointer-events-none gap-0.5", className)}>
      {tokens.map((token, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <ShortcutKey key={idx} token={token} />
      ))}
    </KbdGroup>
  );
}

interface ShortcutRowProps {
  def: ShortcutDef;
  className?: string;
}

export function ShortcutRow({ def, className }: ShortcutRowProps) {
  return (
    <div className={cn("flex min-h-6 items-center justify-between gap-3 px-0.5", className)}>
      <KbdGroup className="gap-0.5">
        <ShortcutKeys tokens={def.keys} />
      </KbdGroup>

      <span className="text-[11px] tracking-[0.12px] text-muted-foreground">{def.description}</span>
    </div>
  );
}

interface ShortcutHintsProps {
  defs: ShortcutDef[];
  className?: string;
}

export function ShortcutHints({ defs, className }: ShortcutHintsProps) {
  if (defs.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {defs.map((def) => (
        <ShortcutRow key={def.id} def={def} />
      ))}
    </div>
  );
}
