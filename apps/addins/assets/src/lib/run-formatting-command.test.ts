import { alignLeftCommand, gapIncreaseHorizontalCommand } from "@deck-pack/presentation-formatting";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeFormattingCommand } = vi.hoisted(() => ({
  executeFormattingCommand: vi.fn(),
}));

vi.mock("@deck-pack/office-js", () => ({
  executeFormattingCommand,
  FormattingUnavailableError: class FormattingUnavailableError extends Error {
    code: string;
    reason: string;

    constructor(code: string, reason: string) {
      super(reason);
      this.code = code;
      this.reason = reason;
    }
  },
  runPowerPoint: vi.fn(),
}));

import { FormattingUnavailableError } from "@deck-pack/office-js";
import { runFormattingCommand } from "./run-formatting-command";

describe("runFormattingCommand", () => {
  beforeEach(() => {
    executeFormattingCommand.mockReset();
  });

  it("executes a known formatting command", async () => {
    executeFormattingCommand.mockResolvedValue({ commandId: "align-left", mutationCount: 1 });

    await expect(runFormattingCommand("align-left", undefined)).resolves.toEqual({
      ok: true,
      commandId: "align-left",
      mutationCount: 1,
    });

    expect(executeFormattingCommand).toHaveBeenCalledWith(expect.any(Function), alignLeftCommand, undefined);
  });

  it("resolves default gap params when none are supplied", async () => {
    executeFormattingCommand.mockResolvedValue({ commandId: "gap-increase-horizontal", mutationCount: 1 });

    await expect(runFormattingCommand("gap-increase-horizontal")).resolves.toEqual({
      ok: true,
      commandId: "gap-increase-horizontal",
      mutationCount: 1,
    });

    expect(executeFormattingCommand).toHaveBeenCalledWith(
      expect.any(Function),
      gapIncreaseHorizontalCommand,
      { mode: "increase", direction: "horizontal", value: 12 },
    );
  });

  it("translates unavailable errors into stable UI results", async () => {
    executeFormattingCommand.mockRejectedValue(new FormattingUnavailableError("exact-shape-count", "Select exactly 2 objects"));

    await expect(runFormattingCommand("swap-positions", undefined)).resolves.toEqual({
      ok: false,
      code: "exact-shape-count",
      reason: "Select exactly 2 objects",
    });
  });

  it("returns an error result for execution failures", async () => {
    executeFormattingCommand.mockRejectedValue(new Error("PowerPoint API is not available"));

    await expect(runFormattingCommand("align-left", undefined)).resolves.toEqual({
      ok: false,
      code: "execution-failed",
      reason: "PowerPoint API is not available",
    });
  });
});
