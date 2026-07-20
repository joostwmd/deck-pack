import { Button } from "@deck-pack/ui/components/system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@deck-pack/ui/components/system/dialog";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import { FileSlotView } from "@deck-pack/ui/components/composite/file-slot-view";
import type { FileSlotController } from "@deck-pack/ui/hooks/use-file-slot-controller";
import { TagsInputView } from "@deck-pack/ui/components/composite/tags-input-view";
import type { TagsInputViewProps } from "@deck-pack/ui/components/composite/tags-input-view";
import type { FormEvent } from "react";

import type {
  ShapeCategory,
  SlideAspectRatio,
  SlideCategory,
} from "@deck-pack/db/library-catalog";

import type { GalleryClassConfig } from "@/features/gallery/class-config";
import {
  GalleryAspectRatioSelect,
  GalleryCategorySelect,
} from "@/features/gallery/gallery-catalog-fields";
import { LibraryStatusBadge } from "@/features/gallery/status-badge";
import type { LibraryItemDetail } from "@/services/types";

export type GalleryDetailViewProps = {
  config: GalleryClassConfig;
  loading: boolean;
  errorMessage?: string;
  item: LibraryItemDetail | null;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  /** False until server metadata is applied — avoids empty Select/TagsInput first paint. */
  formReady: boolean;
  /** Null while waiting for server aliases so TagsInput does not mount empty. */
  aliasesInput: TagsInputViewProps | null;
  /** Remount key after hydrate / save so DiceUI picks up server tags. */
  aliasesInputKey?: string;
  flagCode: string;
  onFlagCodeChange: (value: string) => void;
  category: ShapeCategory | SlideCategory | string;
  onCategoryChange: (value: ShapeCategory | SlideCategory) => void;
  aspectRatio: SlideAspectRatio;
  onAspectRatioChange: (value: SlideAspectRatio) => void;
  /** Remount key for category / aspect selects after hydrate. */
  catalogFieldsKey?: string;
  saving: boolean;
  onSave: (event: FormEvent) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
  archiveOpen: boolean;
  onArchiveOpenChange: (open: boolean) => void;
  actionPending: boolean;
  fileSlots: FileSlotController[];
};

export function GalleryDetailView({
  config,
  loading,
  errorMessage,
  item,
  formReady,
  displayName,
  onDisplayNameChange,
  aliasesInput,
  aliasesInputKey,
  flagCode,
  onFlagCodeChange,
  category,
  onCategoryChange,
  aspectRatio,
  onAspectRatioChange,
  catalogFieldsKey,
  saving,
  onSave,
  onPublish,
  onUnpublish,
  onArchive,
  archiveOpen,
  onArchiveOpenChange,
  actionPending,
  fileSlots,
}: GalleryDetailViewProps) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (errorMessage) {
    return <p className="text-destructive text-sm">{errorMessage}</p>;
  }
  if (!item) {
    return <p className="text-muted-foreground text-sm">Asset not found.</p>;
  }

  const archived = item.status === "archived";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{item.displayName}</h1>
            <LibraryStatusBadge status={item.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            Edit metadata, upload required files, then publish when ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.status === "pending" ? (
            <Button type="button" onClick={onPublish} disabled={actionPending || archived}>
              Publish
            </Button>
          ) : null}
          {item.status === "ready" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onUnpublish}
              disabled={actionPending}
            >
              Unpublish
            </Button>
          ) : null}
          {!archived ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => onArchiveOpenChange(true)}
              disabled={actionPending}
            >
              Archive
            </Button>
          ) : null}
        </div>
      </div>

      <form className="space-y-4 rounded-xl border p-4" onSubmit={onSave}>
        <div className="space-y-2">
          <Label htmlFor="detail-name">Display name</Label>
          <Input
            id="detail-name"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            disabled={archived}
            required
          />
        </div>
        {aliasesInput ? (
          <TagsInputView
            key={aliasesInputKey}
            {...aliasesInput}
            disabled={archived || aliasesInput.disabled}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">Search terms</p>
            <p className="text-muted-foreground text-sm">Loading search terms…</p>
          </div>
        )}
        {config.assetClass === "flag" ? (
          <div className="space-y-2">
            <Label htmlFor="detail-code">Country code</Label>
            <Input
              id="detail-code"
              value={flagCode}
              onChange={(event) => onFlagCodeChange(event.target.value.toUpperCase())}
              disabled={archived}
              required
            />
          </div>
        ) : null}
        {config.assetClass === "shape" || config.assetClass === "slide" ? (
          formReady ? (
            <GalleryCategorySelect
              key={catalogFieldsKey ? `${catalogFieldsKey}-category` : undefined}
              assetClass={config.assetClass}
              value={category}
              onValueChange={onCategoryChange}
              disabled={archived}
              id="detail-category"
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Category</p>
              <p className="text-muted-foreground text-sm">Loading category…</p>
            </div>
          )
        ) : null}
        {config.assetClass === "slide" ? (
          formReady ? (
            <GalleryAspectRatioSelect
              key={catalogFieldsKey ? `${catalogFieldsKey}-aspect` : undefined}
              value={aspectRatio}
              onValueChange={onAspectRatioChange}
              disabled={archived}
              id="detail-aspect"
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Aspect ratio</p>
              <p className="text-muted-foreground text-sm">Loading aspect ratio…</p>
            </div>
          )
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || archived}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="text-sm font-medium">Files</h2>
        {fileSlots.map((slot) => (
          <FileSlotView key={slot.label} slot={slot} />
        ))}
      </div>

      <Dialog open={archiveOpen} onOpenChange={onArchiveOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this {config.singular}?</DialogTitle>
            <DialogDescription>
              It will disappear from the add-in library. Insertion history stays intact. This is not
              a hard delete.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onArchiveOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onArchive} disabled={actionPending}>
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
