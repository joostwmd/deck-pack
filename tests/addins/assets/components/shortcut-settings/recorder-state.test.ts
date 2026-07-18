import { describe, expect, it } from "vitest";

import { applyValidation, recorderReducer } from "@/components/shortcuts/settings/recorder-state";

const conflictShortcut = {
  id: "photos" as const,
  defaultHotkey: "Mod+Shift+P",
  hotkey: "Mod+Alt+X",
  description: "Photos",
  group: "navigation" as const,
  scopes: ["global"] as const,
  ignoreInputs: true,
  customizable: true,
  isCustomized: true,
};

describe("recorderReducer", () => {
  it("moves from idle to recording", () => {
    expect(recorderReducer({ status: "idle" }, { type: "start-recording" })).toEqual({
      status: "recording",
    });
  });

  it("stores a valid draft", () => {
    expect(recorderReducer({ status: "recording" }, { type: "record", hotkey: "Mod+Alt+P" })).toEqual(
      {
        status: "valid-draft",
        draftHotkey: "Mod+Alt+P",
      },
    );
  });

  it("returns to idle after save success", () => {
    expect(
      recorderReducer(
        { status: "saving", draftHotkey: "Mod+Alt+P" },
        { type: "save-success" },
      ),
    ).toEqual({ status: "idle" });
  });
});

describe("applyValidation", () => {
  it("blocks internal conflicts", () => {
    const next = applyValidation(
      { status: "valid-draft", draftHotkey: "Mod+Alt+X" },
      conflictShortcut,
      false,
    );

    expect(next).toEqual({
      status: "internal-conflict",
      draftHotkey: "Mod+Alt+X",
      conflict: conflictShortcut,
    });
  });

  it("warns for powerpoint conflicts", () => {
    const next = applyValidation(
      { status: "valid-draft", draftHotkey: "Mod+K" },
      null,
      true,
    );

    expect(next).toEqual({
      status: "powerpoint-warning",
      draftHotkey: "Mod+K",
    });
  });
});
