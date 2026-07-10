import { cn } from "@deck-pack/ui/lib/utils";
import type { ReactNode, Ref } from "react";

import { ShortcutHints } from "@/components/shortcut-hint";
import { SEARCH_NAVIGATION_SHORTCUTS } from "@/lib/shortcuts";

import { SearchBar } from "./search-bar";

interface SearchSectionProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  searchRef?: Ref<HTMLInputElement>;
  searchRightSlot?: ReactNode;
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
  children,
  className,
}: SearchSectionProps) {
  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <SearchBar
        ref={searchRef}
        value={value}
        onChange={onChange}
        isSearching={isSearching}
        placeholder={placeholder}
        rightSlot={searchRightSlot}
      />

      <ShortcutHints defs={SEARCH_NAVIGATION_SHORTCUTS} className="gap-1" />

      {children}
    </section>
  );
}
