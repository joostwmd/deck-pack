import { useHotkeys } from "@tanstack/react-hotkeys";
import type { Hotkey } from "@tanstack/react-hotkeys";

import { useShortcutBindings } from "@/providers/shortcut-bindings-provider";
import type { ShortcutId } from "@deck-pack/shortcuts";

export interface ShortcutCommand {
  id: ShortcutId;
  execute: () => void;
  enabled?: boolean;
}

export function useShortcutCommands(commands: readonly ShortcutCommand[]) {
  const { getShortcut, isCapturing } = useShortcutBindings();

  useHotkeys(
    commands.map((command) => {
      const shortcut = getShortcut(command.id);
      return {
        hotkey: shortcut.hotkey as Hotkey,
        callback: command.execute,
        options: {
          enabled: !isCapturing && (command.enabled ?? true),
          ignoreInputs: shortcut.ignoreInputs,
          meta: {
            name: shortcut.id,
            description: shortcut.description,
          },
        },
      };
    }),
  );
}
