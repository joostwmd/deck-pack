import { describe, expect, it } from "vitest";

import { hotkeyToKeyTokens } from "./hotkey-display";

describe("hotkeyToKeyTokens", () => {
  it("splits canonical hotkeys into one text token per key", () => {
    const tokens = hotkeyToKeyTokens("Mod+Shift+L");

    expect(tokens).toHaveLength(3);
    expect(tokens.every((token) => token.type === "text")).toBe(true);
    expect(tokens.at(-1)?.value).toBe("L");
  });

  it("handles single-key shortcuts", () => {
    const tokens = hotkeyToKeyTokens("ArrowUp");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe("text");
    expect(tokens[0]?.value).toBe("↑");
  });
});
