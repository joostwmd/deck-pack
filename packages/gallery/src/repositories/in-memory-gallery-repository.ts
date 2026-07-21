import type {
  CreateGalleryItemInput,
  GalleryAssetClass,
  GalleryItemDetail,
  GalleryItemStatus,
  GalleryListItem,
  GalleryScope,
  GalleryUploadRole,
  ShapeCategory,
  SlideAspectRatio,
  SlideCategory,
  UpdateGalleryItemMetadataInput,
} from "../domain/gallery-item";
import type { GalleryRepository } from "./gallery-repository";

type SeedItem = GalleryItemDetail & {
  organizationId: string | null;
  previewBlobPath: string | null;
  previewContentType: string | null;
};

export type InMemoryGallerySeed = {
  items?: SeedItem[];
};

export class InMemoryGalleryRepository implements GalleryRepository {
  private items = new Map<string, SeedItem>();
  private files = new Map<
    string,
    { id: string; blobPath: string; contentType: string; byteSize: number }
  >();

  seed(data: InMemoryGallerySeed): void {
    for (const item of data.items ?? []) {
      this.items.set(item.id, structuredClone(item));
    }
  }

  private matchesScope(item: SeedItem, scope: GalleryScope): boolean {
    if (scope.kind === "global") {
      return item.scope === "global";
    }
    return item.scope === "org" && item.organizationId === scope.organizationId;
  }

  private toListItem(item: SeedItem): GalleryListItem {
    return {
      id: item.id,
      assetClass: item.assetClass,
      status: item.status,
      displayName: item.displayName,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      category: item.shape?.category ?? item.slide?.category ?? null,
      code: item.flag?.code ?? null,
      aspectRatio: item.slide?.aspectRatio ?? null,
      previewBlobPath: item.previewBlobPath,
      previewContentType: item.previewContentType,
    };
  }

  async list(
    scope: GalleryScope,
    input: { assetClass: GalleryAssetClass; includeArchived?: boolean },
  ): Promise<GalleryListItem[]> {
    return [...this.items.values()]
      .filter(
        (item) =>
          this.matchesScope(item, scope) &&
          item.assetClass === input.assetClass &&
          (input.includeArchived || item.status !== "archived"),
      )
      .map((item) => this.toListItem(item));
  }

  async get(scope: GalleryScope, id: string): Promise<GalleryItemDetail | null> {
    const item = this.items.get(id);
    if (!item || !this.matchesScope(item, scope)) return null;
    const { organizationId: _org, previewBlobPath: _p, previewContentType: _c, ...detail } = item;
    return structuredClone(detail);
  }

  async create(scope: GalleryScope, input: CreateGalleryItemInput): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    const now = new Date();
    const item: SeedItem = {
      id,
      assetClass: input.assetClass,
      scope: scope.kind === "global" ? "global" : "org",
      organizationId: scope.kind === "org" ? scope.organizationId : null,
      status: "pending",
      displayName: input.displayName.trim(),
      aliases: input.aliases ?? [],
      createdAt: now,
      updatedAt: now,
      flag:
        input.assetClass === "flag" ? { code: input.flagCode?.trim() ?? "", variants: [] } : null,
      shape:
        input.assetClass === "shape"
          ? { category: (input.category as ShapeCategory) ?? "Arrows", svgFile: null }
          : null,
      slide:
        input.assetClass === "slide"
          ? {
              category: (input.category as SlideCategory) ?? "Content",
              aspectRatio: (input.aspectRatio as SlideAspectRatio) ?? "16:9",
              presentationFile: null,
              thumbnailFile: null,
            }
          : null,
      previewBlobPath: null,
      previewContentType: null,
    };
    this.items.set(id, item);
    return { id };
  }

  async updateMetadata(
    scope: GalleryScope,
    input: UpdateGalleryItemMetadataInput,
  ): Promise<"ok" | "not_found" | "archived"> {
    const item = this.items.get(input.id);
    if (!item || !this.matchesScope(item, scope)) return "not_found";
    if (item.status === "archived") return "archived";
    item.displayName = input.displayName.trim();
    item.aliases = input.aliases;
    item.updatedAt = new Date();
    if (item.flag && input.flagCode !== undefined) {
      item.flag.code = input.flagCode;
    }
    if (item.shape && input.category) {
      item.shape.category = input.category as ShapeCategory;
    }
    if (item.slide) {
      if (input.category) item.slide.category = input.category as SlideCategory;
      if (input.aspectRatio) item.slide.aspectRatio = input.aspectRatio;
    }
    return "ok";
  }

  async setStatus(scope: GalleryScope, id: string, status: GalleryItemStatus): Promise<void> {
    const item = this.items.get(id);
    if (!item || !this.matchesScope(item, scope)) return;
    item.status = status;
    item.updatedAt = new Date();
  }

  async insertFile(input: {
    blobPath: string;
    contentType: string;
    byteSize: number;
    checksum?: string;
  }): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    this.files.set(id, {
      id,
      blobPath: input.blobPath,
      contentType: input.contentType,
      byteSize: input.byteSize,
    });
    return { id };
  }

  async attachFile(input: {
    libraryItemId: string;
    role: GalleryUploadRole;
    fileId: string;
  }): Promise<"ok" | "not_found" | "invalid_role"> {
    const item = this.items.get(input.libraryItemId);
    const file = this.files.get(input.fileId);
    if (!item || !file) return "not_found";

    const fileRef = { ...file };
    if (item.assetClass === "shape") {
      if (input.role !== "svg") return "invalid_role";
      item.shape = item.shape ?? { category: "Arrows", svgFile: null };
      item.shape.svgFile = fileRef;
      item.previewBlobPath = fileRef.blobPath;
      item.previewContentType = fileRef.contentType;
    } else if (item.assetClass === "slide") {
      if (input.role !== "presentation" && input.role !== "thumbnail") return "invalid_role";
      item.slide = item.slide ?? {
        category: "Content",
        aspectRatio: "16:9",
        presentationFile: null,
        thumbnailFile: null,
      };
      if (input.role === "presentation") item.slide.presentationFile = fileRef;
      else {
        item.slide.thumbnailFile = fileRef;
        item.previewBlobPath = fileRef.blobPath;
        item.previewContentType = fileRef.contentType;
      }
    } else if (item.assetClass === "flag") {
      if (input.role !== "rectangle" && input.role !== "square" && input.role !== "circle") {
        return "invalid_role";
      }
      item.flag = item.flag ?? { code: "", variants: [] };
      const existing = item.flag.variants.find((v) => v.role === input.role);
      if (existing) existing.file = fileRef;
      else item.flag.variants.push({ role: input.role, file: fileRef });
      if (input.role === "rectangle") {
        item.previewBlobPath = fileRef.blobPath;
        item.previewContentType = fileRef.contentType;
      }
    } else {
      return "invalid_role";
    }
    item.updatedAt = new Date();
    return "ok";
  }
}
