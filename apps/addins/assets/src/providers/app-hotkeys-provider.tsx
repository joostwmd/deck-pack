import { HotkeysProvider } from "@tanstack/react-hotkeys";
import type { ReactNode } from "react";

interface AppHotkeysProviderProps {
  children: ReactNode;
}

/**
 * Global TanStack Hotkeys defaults for the add-in.
 * - preventDefault/stopPropagation on by default
 * - ignoreInputs uses TanStack smart defaults per hotkey (Mod+ combos and Escape fire in inputs)
 */
export function AppHotkeysProvider({ children }: AppHotkeysProviderProps) {
  return (
    <HotkeysProvider
      defaultOptions={{
        hotkey: {
          preventDefault: true,
          stopPropagation: true,
          conflictBehavior: "warn",
        },
      }}
    >
      {children}
    </HotkeysProvider>
  );
}
