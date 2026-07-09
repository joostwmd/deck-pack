import { Button } from "@deck-pack/ui/components/system/button";
import { Loader2 } from "lucide-react";

interface InsertButtonProps {
  disabled?: boolean;
  isInserting?: boolean;
  label?: string;
  insertingLabel?: string;
  onClick: () => void | Promise<void>;
}

export function InsertButton({
  disabled = false,
  isInserting = false,
  label = "Insert",
  insertingLabel = "Inserting...",
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
          label
        )}
      </Button>
    </div>
  );
}
