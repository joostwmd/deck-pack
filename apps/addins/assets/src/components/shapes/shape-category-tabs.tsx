import { cn } from "@deck-pack/ui/lib/utils";

interface ShapeCategoryTabsProps {
  categories: string[];
  activeCategory?: string;
  onChange: (category: string | undefined) => void;
}

export function ShapeCategoryTabs({
  categories,
  activeCategory,
  onChange,
}: ShapeCategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Shape categories"
      className="flex flex-wrap gap-1.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!activeCategory}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          !activeCategory
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:bg-muted/60",
        )}
        onClick={() => onChange(undefined)}
      >
        All
      </button>

      {categories.map((category) => {
        const isActive = activeCategory === category;

        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/60",
            )}
            onClick={() => onChange(category)}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
