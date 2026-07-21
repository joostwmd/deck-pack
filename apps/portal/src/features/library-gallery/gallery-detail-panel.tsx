import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { ShapeCategory, SlideAspectRatio, SlideCategory } from "@deck-pack/db/gallery-catalog";
import { useFileSlotController } from "@deck-pack/ui/hooks/use-file-slot-controller";
import type { FileSlotController } from "@deck-pack/ui/hooks/use-file-slot-controller";
import type { FileSlotCurrent } from "@deck-pack/ui/lib/file-slot-machine";
import { useTagsInputController } from "@deck-pack/ui/hooks/use-tags-input-controller";

import type { GalleryAssetClass } from "@/features/library-gallery/class-config";
import { GALLERY_CLASS_CONFIG } from "@/features/library-gallery/class-config";
import { defaultAspectRatio } from "@/features/library-gallery/gallery-catalog-fields";
import { GalleryDetailView } from "@/features/library-gallery/gallery-detail-view";
import { uploadLibraryFile } from "@/features/library-gallery/upload-library-file";
import { useServices } from "@/services/services-context";
import type {
  GalleryFileRef,
  GalleryItemDetail,
  LibraryUploadRole,
} from "@deck-pack/library-admin/types";

function toSlotCurrent(file: GalleryFileRef | null | undefined): FileSlotCurrent | null {
  if (!file) return null;
  const base = file.blobPath.split("/").pop();
  return {
    name: base && base.length > 0 ? base : file.blobPath,
    contentType: file.contentType,
    blobPath: file.blobPath,
    byteSize: file.byteSize,
  };
}

function useLibraryFileSlot(args: {
  itemId: string;
  role: LibraryUploadRole;
  label: string;
  accept: string;
  current: FileSlotCurrent | null;
  disabled: boolean;
  onUploaded: () => void;
}): FileSlotController {
  const { library } = useServices();
  return useFileSlotController({
    current: args.current,
    accept: args.accept,
    label: args.label,
    disabled: args.disabled,
    onUploaded: args.onUploaded,
    uploadFile: async (file, { onProgress }) => {
      await uploadLibraryFile({
        library,
        itemId: args.itemId,
        role: args.role,
        file,
        onProgress,
      });
    },
  });
}

/**
 * Mounted with key={item.id} so useState initializers run with server aliases/category
 * on first paint — no useEffect hydrate race for TagsInput / Select.
 */
function GalleryDetailForm({
  assetClass,
  item,
}: {
  assetClass: GalleryAssetClass;
  item: GalleryItemDetail;
}) {
  const config = GALLERY_CLASS_CONFIG[assetClass];
  const { library } = useServices();
  const queryClient = useQueryClient();
  const itemId = item.id;

  const [displayName, setDisplayName] = useState(() => item.displayName);
  const [aliases, setAliases] = useState(() => [...item.aliases]);
  const [flagCode, setFlagCode] = useState(() => item.flag?.code ?? "");
  const [category, setCategory] = useState<ShapeCategory | SlideCategory | "">(
    () =>
      (item.shape?.category ?? item.slide?.category ?? "") as ShapeCategory | SlideCategory | "",
  );
  const [aspectRatio, setAspectRatio] = useState<SlideAspectRatio>(
    () => (item.slide?.aspectRatio as SlideAspectRatio | undefined) ?? defaultAspectRatio(),
  );
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [aliasesEpoch, setAliasesEpoch] = useState(0);

  const aliasesInput = useTagsInputController({
    value: aliases,
    onValueChange: setAliases,
    label: "Search terms",
    description:
      "Aliases used when searching the gallery in the add-in. The display name is already searchable and cannot be added again.",
    placeholder: "Add a search term…",
    max: 50,
    maxLength: 256,
    disabled: item.status === "archived",
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["library", "item", itemId] });
    void queryClient.invalidateQueries({ queryKey: ["library", assetClass] });
  };

  const applyServerDetail = (detail: GalleryItemDetail) => {
    setDisplayName(detail.displayName);
    setAliases([...detail.aliases]);
    setFlagCode(detail.flag?.code ?? "");
    setCategory(
      (detail.shape?.category ?? detail.slide?.category ?? "") as
        | ShapeCategory
        | SlideCategory
        | "",
    );
    setAspectRatio(
      (detail.slide?.aspectRatio as SlideAspectRatio | undefined) ?? defaultAspectRatio(),
    );
    setAliasesEpoch((epoch) => epoch + 1);
    void queryClient.setQueryData(["library", "item", itemId], detail);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      library.update({
        id: itemId,
        displayName: displayName.trim(),
        aliases,
        flagCode: assetClass === "flag" ? flagCode.trim() : undefined,
        category: assetClass !== "flag" && category ? category : undefined,
        aspectRatio: assetClass === "slide" ? aspectRatio : undefined,
      }),
    onSuccess: (detail) => {
      applyServerDetail(detail);
      invalidate();
      toast.success("Saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: () => library.publish({ id: itemId }),
    onSuccess: (detail) => {
      void queryClient.setQueryData(["library", "item", itemId], detail);
      invalidate();
      toast.success("Published");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => library.unpublish({ id: itemId }),
    onSuccess: (detail) => {
      void queryClient.setQueryData(["library", "item", itemId], detail);
      invalidate();
      toast.success("Unpublished");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () => library.archive({ id: itemId }),
    onSuccess: (detail) => {
      setArchiveOpen(false);
      void queryClient.setQueryData(["library", "item", itemId], detail);
      invalidate();
      toast.success("Archived");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archived = item.status === "archived";

  const svgSlot = useLibraryFileSlot({
    itemId,
    role: "svg",
    label: "SVG",
    accept: "image/svg+xml,.svg",
    current: toSlotCurrent(item.shape?.svgFile),
    disabled: archived,
    onUploaded: invalidate,
  });
  const presentationSlot = useLibraryFileSlot({
    itemId,
    role: "presentation",
    label: "Presentation (PPTX)",
    accept: ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    current: toSlotCurrent(item.slide?.presentationFile),
    disabled: archived,
    onUploaded: invalidate,
  });
  const thumbnailSlot = useLibraryFileSlot({
    itemId,
    role: "thumbnail",
    label: "Thumbnail",
    accept: "image/png,image/jpeg,image/webp,image/svg+xml",
    current: toSlotCurrent(item.slide?.thumbnailFile),
    disabled: archived,
    onUploaded: invalidate,
  });
  const rectSlot = useLibraryFileSlot({
    itemId,
    role: "rectangle",
    label: "Rectangle variant",
    accept: "image/png,image/jpeg,image/webp,image/svg+xml",
    current: toSlotCurrent(item.flag?.variants.find((v) => v.role === "rectangle")?.file),
    disabled: archived,
    onUploaded: invalidate,
  });
  const squareSlot = useLibraryFileSlot({
    itemId,
    role: "square",
    label: "Square variant",
    accept: "image/png,image/jpeg,image/webp,image/svg+xml",
    current: toSlotCurrent(item.flag?.variants.find((v) => v.role === "square")?.file),
    disabled: archived,
    onUploaded: invalidate,
  });
  const circleSlot = useLibraryFileSlot({
    itemId,
    role: "circle",
    label: "Circle variant",
    accept: "image/png,image/jpeg,image/webp,image/svg+xml",
    current: toSlotCurrent(item.flag?.variants.find((v) => v.role === "circle")?.file),
    disabled: archived,
    onUploaded: invalidate,
  });

  const fileSlots = useMemo(() => {
    if (assetClass === "shape") return [svgSlot];
    if (assetClass === "slide") return [presentationSlot, thumbnailSlot];
    return [rectSlot, squareSlot, circleSlot];
  }, [assetClass, svgSlot, presentationSlot, thumbnailSlot, rectSlot, squareSlot, circleSlot]);

  const actionPending =
    publishMutation.isPending || unpublishMutation.isPending || archiveMutation.isPending;

  return (
    <GalleryDetailView
      config={config}
      loading={false}
      item={item}
      formReady
      displayName={displayName}
      onDisplayNameChange={setDisplayName}
      aliasesInput={{
        value: aliasesInput.value,
        onValueChange: aliasesInput.onValueChange,
        onValidate: aliasesInput.onValidate,
        onInvalid: aliasesInput.onInvalid,
        disabled: aliasesInput.disabled,
        readOnly: aliasesInput.readOnly,
        editable: aliasesInput.editable,
        addOnPaste: aliasesInput.addOnPaste,
        addOnTab: aliasesInput.addOnTab,
        delimiter: aliasesInput.delimiter,
        max: aliasesInput.max,
        blurBehavior: aliasesInput.blurBehavior,
        label: aliasesInput.label,
        placeholder: aliasesInput.placeholder,
        description: aliasesInput.description,
        showClear: aliasesInput.showClear,
        id: aliasesInput.id,
        name: aliasesInput.name,
      }}
      aliasesInputKey={`${itemId}:${aliasesEpoch}`}
      flagCode={flagCode}
      onFlagCodeChange={setFlagCode}
      category={category}
      onCategoryChange={setCategory}
      aspectRatio={aspectRatio}
      onAspectRatioChange={setAspectRatio}
      catalogFieldsKey={itemId}
      saving={saveMutation.isPending}
      onSave={(event) => {
        event.preventDefault();
        saveMutation.mutate();
      }}
      onPublish={() => publishMutation.mutate()}
      onUnpublish={() => unpublishMutation.mutate()}
      onArchive={() => archiveMutation.mutate()}
      archiveOpen={archiveOpen}
      onArchiveOpenChange={setArchiveOpen}
      actionPending={actionPending}
      fileSlots={fileSlots}
    />
  );
}

export function GalleryDetailPanel({
  assetClass,
  itemId,
}: {
  assetClass: GalleryAssetClass;
  itemId: string;
}) {
  const config = GALLERY_CLASS_CONFIG[assetClass];
  const { library } = useServices();

  const detailQuery = useQuery({
    queryKey: ["library", "item", itemId],
    queryFn: () => library.get({ id: itemId }),
  });

  const item = detailQuery.data ?? null;

  if (detailQuery.isLoading) {
    return (
      <GalleryDetailView
        config={config}
        loading
        item={null}
        formReady={false}
        displayName=""
        onDisplayNameChange={() => undefined}
        aliasesInput={null}
        flagCode=""
        onFlagCodeChange={() => undefined}
        category=""
        onCategoryChange={() => undefined}
        aspectRatio={defaultAspectRatio()}
        onAspectRatioChange={() => undefined}
        saving={false}
        onSave={(event) => event.preventDefault()}
        onPublish={() => undefined}
        onUnpublish={() => undefined}
        onArchive={() => undefined}
        archiveOpen={false}
        onArchiveOpenChange={() => undefined}
        actionPending={false}
        fileSlots={[]}
      />
    );
  }

  if (detailQuery.isError) {
    return (
      <GalleryDetailView
        config={config}
        loading={false}
        errorMessage={detailQuery.error.message}
        item={null}
        formReady={false}
        displayName=""
        onDisplayNameChange={() => undefined}
        aliasesInput={null}
        flagCode=""
        onFlagCodeChange={() => undefined}
        category=""
        onCategoryChange={() => undefined}
        aspectRatio={defaultAspectRatio()}
        onAspectRatioChange={() => undefined}
        saving={false}
        onSave={(event) => event.preventDefault()}
        onPublish={() => undefined}
        onUnpublish={() => undefined}
        onArchive={() => undefined}
        archiveOpen={false}
        onArchiveOpenChange={() => undefined}
        actionPending={false}
        fileSlots={[]}
      />
    );
  }

  if (!item) {
    return (
      <GalleryDetailView
        config={config}
        loading={false}
        item={null}
        formReady={false}
        displayName=""
        onDisplayNameChange={() => undefined}
        aliasesInput={null}
        flagCode=""
        onFlagCodeChange={() => undefined}
        category=""
        onCategoryChange={() => undefined}
        aspectRatio={defaultAspectRatio()}
        onAspectRatioChange={() => undefined}
        saving={false}
        onSave={(event) => event.preventDefault()}
        onPublish={() => undefined}
        onUnpublish={() => undefined}
        onArchive={() => undefined}
        archiveOpen={false}
        onArchiveOpenChange={() => undefined}
        actionPending={false}
        fileSlots={[]}
      />
    );
  }

  return <GalleryDetailForm key={item.id} assetClass={assetClass} item={item} />;
}
