import { formatForDisplay } from "@tanstack/react-hotkeys";
import type { ReactNode } from "react";

const EXAMPLE_COMBO = formatForDisplay("Mod+Shift+L");
const EXAMPLE_INSERT = formatForDisplay("Mod+Enter");
const EXAMPLE_ARROW = formatForDisplay("ArrowUp");

export function ShortcutRulesContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <Rule title="One combo at a time">
        Press all keys together — for example {EXAMPLE_COMBO} or {EXAMPLE_INSERT}. You cannot set
        two letters in a row (like G, then F).
      </Rule>
      <Rule title="Modifiers keep shortcuts out of your way">
        Panel shortcuts usually include ⌘/Ctrl or Shift so they do not fire while you type in search.
      </Rule>
      <Rule title="Some shortcuts only work in context">
        Arrow keys and Enter can work without modifiers, but only in the right place — for example{" "}
        {EXAMPLE_ARROW} in search results or the variant picker.
      </Rule>
      <Rule title="Saved to your account">
        Custom shortcuts sync when you are signed in and apply on every device.
      </Rule>
    </div>
  );
}

function Rule({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

export function getInvalidHotkeyMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "That key combination is not supported. Hold modifiers, then press one key.";
  }

  if (error.message.includes("exactly one non-modifier key")) {
    return "Use one trigger key only — for example ⌘+Shift+L, not two letters in a row.";
  }

  if (error.message.includes("non-modifier key")) {
    return "Add a letter, arrow key, Enter, or another key after your modifiers.";
  }

  return "That key combination is not supported. Hold modifiers, then press one key.";
}
