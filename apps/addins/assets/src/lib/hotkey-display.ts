import { formatForDisplay } from "@tanstack/react-hotkeys";
import type { Hotkey } from "@tanstack/react-hotkeys";

import type { KeyToken } from "@/lib/shortcuts";

export function hotkeyToKeyTokens(hotkey: string): KeyToken[] {
  const parts = hotkey
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((part) => ({
    type: "text" as const,
    value: formatForDisplay(part as Hotkey),
  }));
}

export const hotkeyToDisplayTokens = hotkeyToKeyTokens;
