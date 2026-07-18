import { cn } from "@deck-pack/ui/lib/utils";
import type { ReactNode } from "react";

import { ShortcutHints } from "@/components/shortcuts/shortcut-hint";
import type { ShortcutDef } from "@/lib/shortcuts";

interface VariantsSectionProps {
  shortcutDefs: ShortcutDef[];
  children: ReactNode;
  className?: string;
}

export function VariantsSection({ shortcutDefs, children, className }: VariantsSectionProps) {
  return (
    <section className={cn("flex w-full flex-col gap-4", className)}>
      <ShortcutHints defs={shortcutDefs} />
      {children}
    </section>
  );
}
