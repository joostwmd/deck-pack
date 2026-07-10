import { cn } from "@deck-pack/ui/lib/utils";
import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import { forwardRef, type ReactNode } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  rightSlot?: ReactNode;
  className?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { value, onChange, isSearching = false, placeholder = "Search...", rightSlot, className },
  ref,
) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 shadow-xs",
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
