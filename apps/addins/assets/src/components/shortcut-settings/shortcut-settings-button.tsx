import { Button } from "@deck-pack/ui/components/system/button";
import { Keyboard } from "@phosphor-icons/react";

export interface ShortcutSettingsButtonProps {
  onClick: () => void;
}

export function ShortcutSettingsButton({ onClick }: ShortcutSettingsButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Shortcut settings"
      onClick={onClick}
    >
      <Keyboard className="size-4" />
    </Button>
  );
}
