import { Button } from "@deck-pack/ui/components/system/button";
import { cn } from "@deck-pack/ui/lib/utils";
import { CircleNotch } from "@phosphor-icons/react";

import { ShortcutHints } from "@/components/shortcut-hint";
import { useInsertSectionShortcutDefs } from "@/hooks/use-resolved-shortcut-defs";

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
  const insertSectionShortcuts = useInsertSectionShortcutDefs();

  return (
    <section className={cn("sticky bottom-0 flex flex-col gap-2 bg-background pt-2", className)}>
      <ShortcutHints defs={insertSectionShortcuts} />

      <Button
        className="w-full"
        disabled={disabled || isInserting}
        aria-busy={isInserting}
        onClick={() => void onClick()}
      >
        {isInserting ? (
          <>
            <CircleNotch className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            {insertingLabel}
          </>
        ) : (
          label
        )}
      </Button>
    </section>
  );
}
