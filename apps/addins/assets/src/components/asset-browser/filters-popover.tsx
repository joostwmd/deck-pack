import { Button } from "@deck-pack/ui/components/system/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@deck-pack/ui/components/system/popover";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";
import { FunnelSimple } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface FiltersPopoverProps {
  activeFilterCount: number;
  ariaLabel: string;
  onClearAll?: () => void;
  children: ReactNode;
}

export function FiltersPopover({
  activeFilterCount,
  ariaLabel,
  onClearAll,
  children,
}: FiltersPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative shrink-0 gap-1.5 px-2.5"
            aria-label={
              activeFilterCount > 0 ? `${ariaLabel}, ${activeFilterCount} active` : ariaLabel
            }
          >
            <FunnelSimple className="size-4" aria-hidden />
            <span className="text-xs font-medium">Filters</span>
            {activeFilterCount > 0 ? (
              <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        }
      />

      <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))] gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Filters</p>
          {activeFilterCount > 0 && onClearAll ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={onClearAll}
            >
              Clear all
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

interface FilterFieldProps<T extends string> {
  id: string;
  label: string;
  placeholder: string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  children: ReactNode;
}

export function FilterField<T extends string>({
  id,
  label,
  placeholder,
  value,
  onChange,
  children,
}: FilterFieldProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>

      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
        <SelectTrigger id={id} size="sm" className="h-8 w-full min-w-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
