import { Button } from "@deck-pack/ui/components/system/button";
import { cn } from "@deck-pack/ui/lib/utils";
import { Loader2 } from "lucide-react";

import { ShortcutHints } from "@/components/shortcut-hint";
import { INSERT_SECTION_SHORTCUTS } from "@/lib/shortcuts";

interface InsertSectionProps {
  disabled?: boolean;
  isInserting?: boolean;
  label?: string;
  insertingLabel?: string;
  onClick: () => void | Promise<void>;
  className?: string;
}

export function InsertSection({
  disabled = false,
  isInserting = false,
  label = "Insert",
  insertingLabel = "Inserting...",
  onClick,
  className,
}: InsertSectionProps) {
  return (
    <section className={cn("sticky bottom-0 flex flex-col gap-[7px] bg-background pt-2", className)}>
      <ShortcutHints defs={INSERT_SECTION_SHORTCUTS} />

      <Button
        className="h-9 w-full rounded-lg text-sm font-semibold tracking-[0.07px]"
        disabled={disabled || isInserting}
        onClick={() => void onClick()}
      >
        {isInserting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {insertingLabel}
          </>
        ) : (
          label
        )}
      </Button>
    </section>
  );
}
