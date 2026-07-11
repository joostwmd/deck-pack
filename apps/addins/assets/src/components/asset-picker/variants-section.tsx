import { cn } from "@deck-pack/ui/lib/utils";
import type { ReactNode } from "react";

import { ShortcutHints } from "@/components/shortcut-hint";
import { VARIANT_NAVIGATION_SHORTCUTS } from "@/lib/shortcuts";

interface VariantsSectionProps {
  children: ReactNode;
  className?: string;
}

export function VariantsSection({ children, className }: VariantsSectionProps) {
  return (
    <section className={cn("flex w-full flex-col gap-4", className)}>
      <ShortcutHints defs={VARIANT_NAVIGATION_SHORTCUTS} />
      {children}
    </section>
  );
}
