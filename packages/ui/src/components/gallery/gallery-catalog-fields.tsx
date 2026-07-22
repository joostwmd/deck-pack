import { Label } from "@deck-pack/ui/components/system/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";
import {
  SHAPE_CATEGORIES,
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
  type ShapeCategory,
  type SlideAspectRatio,
  type SlideCategory,
} from "@deck-pack/db/gallery-catalog";

import type { GalleryAssetClass } from "./class-config";

function toSelectItems(options: readonly string[]): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option, option]));
}

export function GalleryCategorySelect({
  assetClass,
  value,
  onValueChange,
  disabled,
  id = "category",
}: {
  assetClass: Exclude<GalleryAssetClass, "flag">;
  value: ShapeCategory | SlideCategory | string;
  onValueChange: (value: ShapeCategory | SlideCategory) => void;
  disabled?: boolean;
  id?: string;
}) {
  const options = assetClass === "shape" ? SHAPE_CATEGORIES : SLIDE_CATEGORIES;
  const items = toSelectItems(options);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Category</Label>
      <Select
        items={items}
        // Use null (not undefined) so Base UI stays controlled from first paint.
        value={value || null}
        onValueChange={(next) => {
          if (!next) return;
          if (assetClass === "shape") {
            onValueChange(next as ShapeCategory);
            return;
          }
          onValueChange(next as SlideCategory);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select category…" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function GalleryAspectRatioSelect({
  value,
  onValueChange,
  disabled,
  id = "aspect-ratio",
}: {
  value: SlideAspectRatio | string;
  onValueChange: (value: SlideAspectRatio) => void;
  disabled?: boolean;
  id?: string;
}) {
  const items = toSelectItems(SLIDE_ASPECT_RATIOS);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Aspect ratio</Label>
      <Select
        items={items}
        value={value || null}
        onValueChange={(next) => {
          if (next) onValueChange(next as SlideAspectRatio);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select aspect ratio…" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {SLIDE_ASPECT_RATIOS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function defaultCategoryFor(assetClass: GalleryAssetClass): string {
  if (assetClass === "shape") return SHAPE_CATEGORIES[0] satisfies ShapeCategory;
  if (assetClass === "slide") return SLIDE_CATEGORIES[0] satisfies SlideCategory;
  return "";
}

export function defaultAspectRatio(): SlideAspectRatio {
  return SLIDE_ASPECT_RATIOS[0];
}
