import { galleryKeys } from "@deck-pack/hooks/gallery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import type { ShapeCategory, SlideAspectRatio, SlideCategory } from "@deck-pack/db/gallery-catalog";
import { useTagsInputController } from "@deck-pack/ui/hooks/use-tags-input-controller";

import type { GalleryAssetClass } from "@/domains/gallery/class-config";
import { GALLERY_CLASS_CONFIG } from "@/domains/gallery/class-config";
import {
  defaultAspectRatio,
  defaultCategoryFor,
} from "@deck-pack/ui/components/gallery/gallery-catalog-fields";
import { GalleryNewView } from "@deck-pack/ui/components/gallery/gallery-new-view";
import { useServices } from "@/services/services-context";

export function GalleryNewPanel({ assetClass }: { assetClass: GalleryAssetClass }) {
  const config = GALLERY_CLASS_CONFIG[assetClass];
  const { gallery } = useServices();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [flagCode, setFlagCode] = useState("");
  const [category, setCategory] = useState<ShapeCategory | SlideCategory | "">(
    () => defaultCategoryFor(assetClass) as ShapeCategory | SlideCategory | "",
  );
  const [aspectRatio, setAspectRatio] = useState<SlideAspectRatio>(() => defaultAspectRatio());

  const aliasesInput = useTagsInputController({
    label: "Search terms",
    description:
      "Aliases used when searching the gallery in the add-in. The display name is already searchable and cannot be added again.",
    placeholder: "Add a search term…",
    max: 50,
    maxLength: 256,
    // Injected from the app — keep UI free of tRPC. Wire suggestAliases when the API exists.
    api: {
      suggestTags: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      gallery.create({
        assetClass,
        displayName: displayName.trim(),
        aliases: aliasesInput.value,
        flagCode: assetClass === "flag" ? flagCode.trim() : undefined,
        category: assetClass !== "flag" && category ? category : undefined,
        aspectRatio: assetClass === "slide" ? aspectRatio : undefined,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: galleryKeys.list(assetClass, false) });
      toast.success("Draft created");
      const detail = config.detailPath(result.id);
      void navigate({ to: detail.to, params: detail.params });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <GalleryNewView
      config={config}
      displayName={displayName}
      onDisplayNameChange={setDisplayName}
      aliasesInput={aliasesInput}
      flagCode={flagCode}
      onFlagCodeChange={setFlagCode}
      category={category}
      onCategoryChange={setCategory}
      aspectRatio={aspectRatio}
      onAspectRatioChange={setAspectRatio}
      submitting={createMutation.isPending}
      onSubmit={(event) => {
        event.preventDefault();
        createMutation.mutate();
      }}
    />
  );
}
