import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import { TagsInputView } from "@deck-pack/ui/components/composite/tags-input-view";
import type { TagsInputViewProps } from "@deck-pack/ui/components/composite/tags-input-view";
import { Link } from "@tanstack/react-router";
import type { FormEvent } from "react";

import type { ShapeCategory, SlideAspectRatio, SlideCategory } from "@deck-pack/db/library-catalog";

import type { GalleryClassConfig } from "@/features/library-gallery/class-config";
import {
  GalleryAspectRatioSelect,
  GalleryCategorySelect,
} from "@/features/library-gallery/gallery-catalog-fields";

export type GalleryNewViewProps = {
  config: GalleryClassConfig;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  aliasesInput: TagsInputViewProps;
  flagCode: string;
  onFlagCodeChange: (value: string) => void;
  category: ShapeCategory | SlideCategory | string;
  onCategoryChange: (value: ShapeCategory | SlideCategory) => void;
  aspectRatio: SlideAspectRatio;
  onAspectRatioChange: (value: SlideAspectRatio) => void;
  submitting: boolean;
  onSubmit: (event: FormEvent) => void;
};

export function GalleryNewView({
  config,
  displayName,
  onDisplayNameChange,
  aliasesInput,
  flagCode,
  onFlagCodeChange,
  category,
  onCategoryChange,
  aspectRatio,
  onAspectRatioChange,
  submitting,
  onSubmit,
}: GalleryNewViewProps) {
  return (
    <form className="mx-auto max-w-xl space-y-6" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">New {config.singular}</h1>
        <p className="text-muted-foreground text-sm">
          Creates a draft. Upload files on the detail page, then publish.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border p-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            required
          />
        </div>

        <TagsInputView {...aliasesInput} />

        {config.assetClass === "flag" ? (
          <div className="space-y-2">
            <Label htmlFor="flag-code">Country code</Label>
            <Input
              id="flag-code"
              value={flagCode}
              onChange={(event) => onFlagCodeChange(event.target.value.toUpperCase())}
              placeholder="US"
              required
            />
          </div>
        ) : null}

        {config.assetClass === "shape" || config.assetClass === "slide" ? (
          <GalleryCategorySelect
            assetClass={config.assetClass}
            value={category}
            onValueChange={onCategoryChange}
          />
        ) : null}

        {config.assetClass === "slide" ? (
          <GalleryAspectRatioSelect
            value={aspectRatio}
            onValueChange={onAspectRatioChange}
          />
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" render={<Link to={config.listPath} />}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
