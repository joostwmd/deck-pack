import type { Hotkey } from "@tanstack/react-hotkeys";

/**
 * Common PowerPoint shortcuts that may conflict with add-in bindings.
 * Used when users customize shortcuts in a future settings panel.
 */
export const POWERPOINT_SHORTCUTS: Record<string, string> = {
  "Mod+S": "Save presentation",
  "Mod+Z": "Undo",
  "Mod+Y": "Redo",
  "Mod+C": "Copy",
  "Mod+V": "Paste",
  "Mod+X": "Cut",
  "Mod+A": "Select all",
  "Mod+D": "Duplicate slide",
  "Mod+N": "New presentation",
  "Mod+O": "Open presentation",
  "Mod+P": "Print",
  "Mod+F": "Find",
  "Mod+I": "Italic",
  "Mod+K": "Insert hyperlink",
  "Mod+G": "Find next",
  "Mod+H": "Replace",
  "Mod+B": "Bold",
  "Mod+U": "Underline",
  "Mod+M": "New slide",
  "Mod+W": "Close presentation",
  "F5": "Start slideshow",
  "Escape": "End slideshow / dismiss",
};

export interface ShortcutConflict {
  hotkey: Hotkey;
  powerPointAction: string;
}

export function detectPowerPointConflict(hotkey: Hotkey): ShortcutConflict | null {
  const action = POWERPOINT_SHORTCUTS[hotkey];

  if (!action) {
    return null;
  }

  return { hotkey, powerPointAction: action };
}

export function detectPowerPointConflicts(hotkeys: Hotkey[]): ShortcutConflict[] {
  return hotkeys
    .map((hotkey) => detectPowerPointConflict(hotkey))
    .filter((conflict): conflict is ShortcutConflict => conflict !== null);
}
