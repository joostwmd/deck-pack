import { cn } from "@deck-pack/ui/lib/utils";
import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import { forwardRef, type ReactNode } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  rightSlot?: ReactNode;
  resultsId?: string;
  activeDescendantId?: string;
  isExpanded?: boolean;
  className?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  {
    value,
    onChange,
    isSearching = false,
    placeholder = "Search...",
    rightSlot,
    resultsId,
    activeDescendantId,
    isExpanded = false,
    className,
  },
  ref,
) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-border/80 bg-background px-2 py-1 transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15",
        className,
      )}
    >
      <div className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
        {isSearching ? (
          <CircleNotch className="size-4 animate-spin" aria-label="Searching" />
        ) : (
          <MagnifyingGlass className="size-4" aria-hidden />
        )}
      </div>

      <input
        ref={ref}
        type="text"
        role="combobox"
        aria-label={placeholder}
        aria-autocomplete="list"
        aria-controls={resultsId}
        aria-activedescendant={activeDescendantId}
        aria-expanded={isExpanded}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base leading-6 outline-none placeholder:text-muted-foreground"
      />

      {rightSlot ? (
        <div className="flex h-5 shrink-0 items-center justify-center gap-0.5">{rightSlot}</div>
      ) : null}
    </div>
  );
});
