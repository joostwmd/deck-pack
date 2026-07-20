import { Button } from "@deck-pack/ui/components/system/button";
import { Checkbox } from "@deck-pack/ui/components/system/checkbox";
import { Label } from "@deck-pack/ui/components/system/label";
import { ImageBroken } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import type { GalleryClassConfig } from "@/features/gallery/class-config";
import { LibraryStatusBadge } from "@/features/gallery/status-badge";
import type { LibraryListItem } from "@/services/types";

export type GalleryListViewProps = {
  config: GalleryClassConfig;
  loading: boolean;
  errorMessage?: string;
  items: LibraryListItem[];
  includeArchived: boolean;
  onIncludeArchivedChange: (next: boolean) => void;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function GalleryPreview({ item }: { item: LibraryListItem }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(item.previewUrl) && !failed;

  return (
    <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted/50 p-4">
      {showImage ? (
        <img
          src={item.previewUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
          <ImageBroken className="size-8 opacity-60" aria-hidden />
          <span className="text-xs">No preview</span>
        </div>
      )}
    </div>
  );
}

function metaLine(config: GalleryClassConfig, item: LibraryListItem): string | null {
  if (config.assetClass === "flag") {
    return item.code ? item.code.toUpperCase() : null;
  }
  if (config.assetClass === "slide") {
    const parts = [item.category, item.aspectRatio].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  return item.category;
}

export function GalleryListView({
  config,
  loading,
  errorMessage,
  items,
  includeArchived,
  onIncludeArchivedChange,
}: GalleryListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground text-sm">{config.description}</p>
        </div>
        <Button render={<Link to={config.newPath} />}>New {config.singular}</Button>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="include-archived"
          checked={includeArchived}
          onCheckedChange={(checked) => onIncludeArchivedChange(checked === true)}
        />
        <Label htmlFor="include-archived" className="text-sm font-normal">
          Show archived
        </Label>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed">
          <p className="text-muted-foreground text-sm">
            No {config.title.toLowerCase()} yet. Create one to get started.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const detail = config.detailPath(item.id);
            const meta = metaLine(config, item);
            return (
              <li key={item.id}>
                <Link
                  to={detail.to}
                  params={detail.params}
                  className="group block overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <GalleryPreview item={item} />
                  <div className="space-y-2 border-t p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="truncate text-sm font-medium leading-5 group-hover:underline"
                        title={item.displayName}
                      >
                        {item.displayName}
                      </p>
                      <LibraryStatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{meta ?? "—"}</span>
                      <span className="shrink-0">{formatDate(item.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
