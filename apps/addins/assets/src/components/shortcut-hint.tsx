import { Kbd, KbdGroup } from "@deck-pack/ui/components/system/kbd";
import { cn } from "@deck-pack/ui/lib/utils";

import type { KeyToken, ShortcutDef } from "@/lib/shortcuts";

// ---------------------------------------------------------------------------
// Single key chip — text or icon variant
// ---------------------------------------------------------------------------

function ShortcutKey({ token }: { token: KeyToken }) {
  if (token.type === "icon") {
    const Icon = token.icon;
    return (
      <Kbd className="rounded-sm border border-border">
        <Icon aria-label={token.label} />
      </Kbd>
    );
  }

  return <Kbd className="rounded-sm border border-border">{token.value}</Kbd>;
}

export function ShortcutKeys({ tokens }: { tokens: KeyToken[] }) {
  return (
    <>
      {tokens.map((token, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <ShortcutKey key={idx} token={token} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Single shortcut row  —  [keys]    description
// Matches the "shortcut-explanation" pill from the Figma design.
// ---------------------------------------------------------------------------

interface ShortcutRowProps {
  def: ShortcutDef;
  className?: string;
}

export function ShortcutRow({ def, className }: ShortcutRowProps) {
  return (
    <div
      className={cn(
        "flex h-8 items-center justify-between rounded-md bg-secondary px-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      <KbdGroup>
        <ShortcutKeys tokens={def.keys} />
      </KbdGroup>

      <span className="text-[11px] tracking-[0.18px] text-muted-foreground">{def.description}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stacked list of shortcut rows
// ---------------------------------------------------------------------------

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
