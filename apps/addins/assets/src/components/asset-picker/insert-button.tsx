import { Button } from "@deck-pack/ui/components/system/button";
import { Kbd, KbdGroup } from "@deck-pack/ui/components/system/kbd";
import { CornerDownLeft } from "lucide-react";
import { Loader2 } from "lucide-react";

interface InsertButtonProps {
  disabled?: boolean;
  isInserting?: boolean;
  label?: string;
  insertingLabel?: string;
  showShortcut?: boolean;
  onClick: () => void | Promise<void>;
}

export function InsertButton({
  disabled = false,
  isInserting = false,
  label = "Insert",
  insertingLabel = "Inserting...",
  showShortcut = false,
  onClick,
}: InsertButtonProps) {
  return (
    <div className="sticky bottom-0 border-t bg-background p-4">
      <Button className="w-full" disabled={disabled || isInserting} onClick={() => void onClick()}>
        {isInserting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {insertingLabel}
          </>
        ) : (
          <>
            <span>{label}</span>
            {showShortcut && (
              <KbdGroup className="ml-auto opacity-60">
                <Kbd className="rounded-sm border border-current bg-transparent">⌘</Kbd>
                <Kbd className="rounded-sm border border-current bg-transparent">
                  <CornerDownLeft aria-label="↵" />
                </Kbd>
              </KbdGroup>
            )}
          </>
        )}
      </Button>
    </div>
  );
}
