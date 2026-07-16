import { cn } from "@deck-pack/ui/lib/utils";
import type { ReactNode, Ref } from "react";

import { ShortcutHints } from "@/components/shortcut-hint";
import type { ShortcutDef } from "@/lib/shortcuts";

import { SearchBar } from "./search-bar";

interface SearchSectionProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  searchRef?: Ref<HTMLInputElement>;
  searchRightSlot?: ReactNode;
  resultsId?: string;
  activeDescendantId?: string;
  isExpanded?: boolean;
  shortcutDefs: ShortcutDef[];
  children?: ReactNode;
  className?: string;
}

export function SearchSection({
  value,
  onChange,
  isSearching = false,
  placeholder,
  searchRef,
  searchRightSlot,
  resultsId,
  activeDescendantId,
  isExpanded = false,
  shortcutDefs,
  children,
  className,
}: SearchSectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <SearchBar
        ref={searchRef}
        value={value}
        onChange={onChange}
        isSearching={isSearching}
        placeholder={placeholder}
        rightSlot={searchRightSlot}
        resultsId={resultsId}
        activeDescendantId={activeDescendantId}
        isExpanded={isExpanded}
      />

      <ShortcutHints defs={shortcutDefs} className="gap-1" />

      {children}
    </section>
  );
}
