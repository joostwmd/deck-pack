import { alignLeftCommand, gapIncreaseHorizontalCommand } from "@deck-pack/presentation-formatting";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeFormattingCommand, runPowerPoint } = vi.hoisted(() => ({
  executeFormattingCommand: vi.fn(),
  runPowerPoint: vi.fn(),
}));

vi.mock("@deck-pack/office-js", () => ({
  FormattingUnavailableError: class FormattingUnavailableError extends Error {
    code: string;
    reason: string;

    constructor(code: string, reason: string) {
      super(reason);
      this.code = code;
      this.reason = reason;
    }
  },
}));

import { FormattingUnavailableError } from "@deck-pack/office-js";
import { runFormattingCommand } from "@/lib/run-formatting-command";

const office = {
  executeFormattingCommand,
  runPowerPoint,
};

describe("runFormattingCommand", () => {
  beforeEach(() => {
    executeFormattingCommand.mockReset();
  });

  it("executes a known formatting command", async () => {
    executeFormattingCommand.mockResolvedValue({ commandId: "align-left", mutationCount: 1 });

    await expect(runFormattingCommand(office, "align-left", undefined)).resolves.toEqual({
      ok: true,
      commandId: "align-left",
      mutationCount: 1,
    });

    expect(executeFormattingCommand).toHaveBeenCalledWith(runPowerPoint, alignLeftCommand, undefined);
  });

  it("resolves default gap params when none are supplied", async () => {
    executeFormattingCommand.mockResolvedValue({ commandId: "gap-increase-horizontal", mutationCount: 1 });

    await expect(runFormattingCommand(office, "gap-increase-horizontal")).resolves.toEqual({
      ok: true,
      commandId: "gap-increase-horizontal",
      mutationCount: 1,
    });

    expect(executeFormattingCommand).toHaveBeenCalledWith(
      runPowerPoint,
      gapIncreaseHorizontalCommand,
      { mode: "increase", direction: "horizontal", value: 12 },
    );
  });

  it("translates unavailable errors into stable UI results", async () => {
    executeFormattingCommand.mockRejectedValue(new FormattingUnavailableError("exact-shape-count", "Select exactly 2 objects"));

    await expect(runFormattingCommand(office, "swap-positions", undefined)).resolves.toEqual({
      ok: false,
      code: "exact-shape-count",
      reason: "Select exactly 2 objects",
    });
  });

  it("returns an error result for execution failures", async () => {
    executeFormattingCommand.mockRejectedValue(new Error("PowerPoint API is not available"));

    await expect(runFormattingCommand(office, "align-left", undefined)).resolves.toEqual({
      ok: false,
      code: "execution-failed",
      reason: "PowerPoint API is not available",
    });
  });
});
