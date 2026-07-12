import type { AnyFormattingCommand, FormattingActionId } from "../types";
import { alignCommands } from "./align";
import { distributeCommands } from "./distribute";
import { gapCommands } from "./gap";
import { matchSizeCommands } from "./match-size";
import { rectifyLinesCommand } from "./rectify-lines";
import { setBoundsCommand } from "./set-bounds";
import { stackCommands } from "./stack";
import { swapCommands } from "./swap";
import { textCommands } from "./text";

export const formattingCommandRegistry = [
  ...alignCommands,
  ...distributeCommands,
  ...matchSizeCommands,
  ...stackCommands,
  ...gapCommands,
  ...swapCommands,
  rectifyLinesCommand,
  setBoundsCommand,
  ...textCommands,
] satisfies AnyFormattingCommand[];

export function getFormattingCommandById(id: FormattingActionId): AnyFormattingCommand | undefined {
  return formattingCommandRegistry.find((command) => command.id === id);
}

export function getUniqueFormattingCommandIds(): FormattingActionId[] {
  return formattingCommandRegistry.map((command) => command.id);
}
