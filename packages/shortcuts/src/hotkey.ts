const MODIFIER_ALIASES: Record<string, "Mod" | "Ctrl" | "Alt" | "Shift"> = {
  mod: "Mod",
  cmd: "Mod",
  meta: "Mod",
  command: "Mod",
  ctrl: "Ctrl",
  control: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
};

const KEY_ALIASES: Record<string, string> = {
  esc: "Escape",
  escape: "Escape",
  return: "Enter",
  enter: "Enter",
  space: "Space",
  spacebar: "Space",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
};

const MODIFIER_ORDER = ["Mod", "Ctrl", "Alt", "Shift"] as const;

export class InvalidHotkeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidHotkeyError";
  }
}

export function canonicalizeHotkey(raw: string): string {
  const parts = raw
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new InvalidHotkeyError("Hotkey must include at least one key");
  }

  const modifiers = new Set<(typeof MODIFIER_ORDER)[number]>();
  let key: string | null = null;

  for (const part of parts) {
    const normalized = part.toLowerCase();
    const modifier = MODIFIER_ALIASES[normalized];

    if (modifier) {
      modifiers.add(modifier);
      continue;
    }

    if (key !== null) {
      throw new InvalidHotkeyError("Hotkey must contain exactly one non-modifier key");
    }

    key = normalizeKey(part);
  }

  if (!key) {
    throw new InvalidHotkeyError("Hotkey must include a non-modifier key");
  }

  const orderedModifiers = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));
  return [...orderedModifiers, key].join("+");
}

function normalizeKey(part: string): string {
  const alias = KEY_ALIASES[part.toLowerCase()];
  if (alias) return alias;

  if (part.length === 1) {
    return part.toUpperCase();
  }

  if (part.startsWith("F") && /^F\d{1,2}$/i.test(part)) {
    return part.toUpperCase();
  }

  if (part.startsWith("Arrow")) {
    return part.charAt(0).toUpperCase() + part.slice(1);
  }

  if (part === "/" || part === "?" || part === ".") {
    return part;
  }

  return part.charAt(0).toUpperCase() + part.slice(1);
}

export function hotkeysEqual(a: string, b: string): boolean {
  try {
    return canonicalizeHotkey(a) === canonicalizeHotkey(b);
  } catch {
    return false;
  }
}
