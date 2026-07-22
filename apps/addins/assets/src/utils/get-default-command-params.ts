import type { FormattingActionId } from "@deck-pack/shape-commands";

export function getDefaultCommandParams(commandId: FormattingActionId): unknown {
  switch (commandId) {
    case "gap-exact-horizontal":
      return { mode: "exact", direction: "horizontal", value: 12 };
    case "gap-exact-vertical":
      return { mode: "exact", direction: "vertical", value: 12 };
    case "gap-increase-horizontal":
    case "gap-decrease-horizontal":
      return {
        mode: commandId.includes("increase") ? "increase" : "decrease",
        direction: "horizontal",
        value: 12,
      };
    case "gap-increase-vertical":
    case "gap-decrease-vertical":
      return {
        mode: commandId.includes("increase") ? "increase" : "decrease",
        direction: "vertical",
        value: 12,
      };
    case "set-bounds":
      return {};
    default:
      return undefined;
  }
}
