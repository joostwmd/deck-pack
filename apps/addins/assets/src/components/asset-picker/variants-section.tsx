import { cn } from "@deck-pack/ui/lib/utils";
import type { ReactNode } from "react";

import { ShortcutHints } from "@/components/shortcut-hint";
import { useVariantNavigationShortcutDefs } from "@/hooks/use-resolved-shortcut-defs";

interface VariantsSectionProps {
  children: ReactNode;
  className?: string;
}

export function VariantsSection({ children, className }: VariantsSectionProps) {
  const variantNavigationShortcuts = useVariantNavigationShortcutDefs();

  return (
    <section className={cn("flex w-full flex-col gap-4", className)}>
      <ShortcutHints defs={variantNavigationShortcuts} />
      {children}
    </section>
  );
}
