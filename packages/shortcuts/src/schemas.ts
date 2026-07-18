import { z } from "zod";

import { SHORTCUT_SCHEMA_VERSION } from "./constants";

export const shortcutIdSchema = z.enum([
  "logos",
  "flags",
  "icons",
  "photos",
  "harvey-balls",
  "slides",
  "shapes",
  "agenda",
  "check",
  "format",
  "themes",
  "openMenu",
  "focusSearch",
  "navigateResultsUp",
  "navigateResultsDown",
  "selectResult",
  "navigateVariantsUp",
  "navigateVariantsDown",
  "navigateVariantsLeft",
  "navigateVariantsRight",
  "selectVariant",
  "insert",
  "back",
  "openShortcuts",
]);

export type ShortcutId = z.infer<typeof shortcutIdSchema>;

export const hotkeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((value) => isValidHotkey(value), { message: "Invalid hotkey chord" });

export const shortcutOverrideSchema = z.object({
  shortcutId: shortcutIdSchema,
  hotkey: hotkeySchema,
  schemaVersion: z.number().int().positive(),
});

export type ShortcutOverride = z.infer<typeof shortcutOverrideSchema>;

export const listShortcutsOutputSchema = z.object({
  schemaVersion: z.literal(SHORTCUT_SCHEMA_VERSION),
  overrides: z.array(shortcutOverrideSchema),
});

export const setShortcutOverrideInputSchema = z.object({
  shortcutId: shortcutIdSchema,
  hotkey: hotkeySchema,
});

export const resetShortcutOverrideInputSchema = z.object({
  shortcutId: shortcutIdSchema,
});

export const resetAllShortcutsOutputSchema = z.object({
  success: z.literal(true),
  deletedCount: z.number().int().nonnegative(),
});

export const resetShortcutOutputSchema = z.object({
  success: z.literal(true),
});

const STANDALONE_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  "Escape",
  "Tab",
  "Backspace",
  "Delete",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Space",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
]);

const MODIFIERS = new Set(["Mod", "Ctrl", "Alt", "Shift", "Meta", "Cmd", "Option"]);

function isValidHotkey(value: string): boolean {
  const parts = value.split("+").filter(Boolean);
  if (parts.length === 0) return false;

  const modifiers = parts.slice(0, -1);
  const key = parts[parts.length - 1];

  if (!key || MODIFIERS.has(key)) return false;

  const hasModifier = modifiers.length > 0;
  const isStandalone = STANDALONE_KEYS.has(key);
  const isPrintable = key.length === 1 || key === "/" || key === "?" || key === ".";

  if (isStandalone) return true;
  if (isPrintable) return hasModifier;
  return hasModifier;
}
