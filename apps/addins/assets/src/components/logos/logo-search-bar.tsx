import { Input } from "@deck-pack/ui/components/system/input";
import { Loader2, Search } from "lucide-react";

interface LogoSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
}

export function LogoSearchBar({
  value,
  onChange,
  isSearching = false,
  placeholder = "Search...",
}: LogoSearchBarProps) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pr-9"
      />
      <div className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground">
        {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
      </div>
    </div>
  );
}
