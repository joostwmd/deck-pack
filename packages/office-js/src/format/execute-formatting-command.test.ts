import { alignLeftCommand, matchWidthCommand, rectifyLinesCommand, setBoundsCommand, stackVerticalCommand, swapPositionsCommand } from "@deck-pack/presentation-formatting";
import { describe, expect, it } from "vitest";

import { executeFormattingCommand } from "./execute-formatting-command";
import { FormattingUnavailableError } from "./formatting-errors";
import { fakePowerPointSelection } from "../test-utils/fake-powerpoint-context";

describe("executeFormattingCommand", () => {
  it("runs align-left from live selection through to Office shape proxies", async () => {
    const office = fakePowerPointSelection([
      { id: "a", left: 20, top: 0, width: 10, height: 10 },
      { id: "b", left: 80, top: 0, width: 10, height: 10 },
    ]);

    await executeFormattingCommand(office.runner, alignLeftCommand, undefined);

    expect(office.shape("b").left).toBe(20);
    expect(office.syncCount).toBeGreaterThan(0);
  });

  it("runs match-width using the first selected shape as reference", async () => {
    const office = fakePowerPointSelection([
      { id: "ref", left: 0, top: 0, width: 50, height: 20 },
      { id: "other", left: 80, top: 0, width: 10, height: 10 },
    ]);

    await executeFormattingCommand(office.runner, matchWidthCommand, undefined);
    expect(office.shape("other").width).toBe(50);
  });

  it("runs stack-vertical with a single sync batch", async () => {
    const office = fakePowerPointSelection([
      { id: "a", left: 0, top: 0, width: 10, height: 20 },
      { id: "b", left: 0, top: 30, width: 10, height: 10 },
    ]);

    await executeFormattingCommand(office.runner, stackVerticalCommand, undefined);
    expect(office.shape("b").top).toBe(20);
    expect(office.syncCount).toBeGreaterThan(0);
  });

  it("runs swap-positions for exactly two shapes", async () => {
    const office = fakePowerPointSelection([
      { id: "a", left: 0, top: 0, width: 10, height: 10 },
      { id: "b", left: 40, top: 0, width: 10, height: 10 },
    ]);

    await executeFormattingCommand(office.runner, swapPositionsCommand, undefined);
    expect(office.shape("a").left).toBe(40);
    expect(office.shape("b").left).toBe(0);
  });

  it("runs set-bounds with partial params", async () => {
    const office = fakePowerPointSelection([
      { id: "a", left: 0, top: 0, width: 10, height: 10 },
    ]);

    await executeFormattingCommand(office.runner, setBoundsCommand, { left: 5, width: 30 });
    expect(office.shape("a").left).toBe(5);
    expect(office.shape("a").width).toBe(30);
  });

  it("throws when command is unavailable for the current selection", async () => {
    const office = fakePowerPointSelection([{ id: "a", left: 0, top: 0, width: 10, height: 10 }]);

    await expect(executeFormattingCommand(office.runner, swapPositionsCommand, undefined)).rejects.toBeInstanceOf(
      FormattingUnavailableError,
    );
  });

  it("does not mutate shapes when the plan is empty", async () => {
    const office = fakePowerPointSelection([
      { id: "a", left: 10, top: 0, width: 20, height: 20 },
      { id: "b", left: 10, top: 40, width: 30, height: 10 },
    ]);

    const before = { ...office.shape("b") };
    await executeFormattingCommand(office.runner, alignLeftCommand, undefined);
    expect(office.shape("b")).toEqual(before);
  });
});

describe("rectifyLines integration", () => {
  it("rectifies line shapes through the executor", async () => {
    const office = fakePowerPointSelection([
      { id: "line", left: 0, top: 0, width: 100, height: 2, type: "line" },
    ]);

    await executeFormattingCommand(office.runner, rectifyLinesCommand, undefined);
    expect(office.shape("line").height).toBe(0);
  });
});
