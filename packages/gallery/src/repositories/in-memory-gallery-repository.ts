import type {
  GetReadyFlagDetailsInput,
  ReadyFlagDetailsRow,
  ReadyFlagSearchRow,
  ReadyShapeRow,
  ReadySlideRow,
  SearchReadyFlagsInput,
  SearchReadyShapesInput,
  SearchReadySlidesInput,
} from "../domain/discovery";
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

export type InMemoryDiscoverySeed = {
  flags?: ReadyFlagSearchRow[];
  flagDetails?: ReadyFlagDetailsRow[];
  shapes?: ReadyShapeRow[];
  slides?: ReadySlideRow[];
};

export class InMemoryGalleryRepository implements GalleryRepository {
  private items = new Map<string, SeedItem>();
  private files = new Map<
    string,
    { id: string; blobPath: string; contentType: string; byteSize: number }
  >();
  private readyFlags: ReadyFlagSearchRow[] = [];
  private readyFlagDetails = new Map<string, ReadyFlagDetailsRow>();
  private readyShapes: ReadyShapeRow[] = [];
  private readySlides: ReadySlideRow[] = [];

  seed(data: InMemoryGallerySeed): void {
    for (const item of data.items ?? []) {
      this.items.set(item.id, structuredClone(item));
    }
  }

  seedDiscovery(data: InMemoryDiscoverySeed): void {
    if (data.flags) this.readyFlags.push(...structuredClone(data.flags));
    for (const details of data.flagDetails ?? []) {
      this.readyFlagDetails.set(details.id, structuredClone(details));
    }
    if (data.shapes) this.readyShapes.push(...structuredClone(data.shapes));
    if (data.slides) this.readySlides.push(...structuredClone(data.slides));
  }

  private inDiscoveryScope(
    row: { scope: "global" | "org" },
    input: { organizationId?: string | null; internalOnly?: boolean },
  ): boolean {
    if (input.internalOnly) return row.scope === "global";
    if (row.scope === "global") return true;
    // Org-scoped rows are visible when an organization context is present.
    return input.organizationId != null && input.organizationId !== "";
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
    galleryItemId: string;
    role: GalleryUploadRole;
    fileId: string;
  }): Promise<"ok" | "not_found" | "invalid_role"> {
    const item = this.items.get(input.galleryItemId);
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

  async searchReadyFlags(input: SearchReadyFlagsInput): Promise<ReadyFlagSearchRow[]> {
    const normalized = input.query.trim().toLowerCase();
    return this.readyFlags.filter((row) => {
      if (!this.inDiscoveryScope(row, input)) return false;
      if (!normalized) return true;
      return (
        row.displayName.toLowerCase().includes(normalized) ||
        row.code.toLowerCase().includes(normalized)
      );
    });
  }

  async getReadyFlagDetails(input: GetReadyFlagDetailsInput): Promise<ReadyFlagDetailsRow | null> {
    return this.readyFlagDetails.get(input.id) ?? null;
  }

  async searchReadyShapes(input: SearchReadyShapesInput): Promise<ReadyShapeRow[]> {
    return this.readyShapes.filter((row) => {
      if (!this.inDiscoveryScope(row, input)) return false;
      if (input.category && row.category !== input.category) return false;
      return true;
    });
  }

  async searchReadySlides(input: SearchReadySlidesInput): Promise<ReadySlideRow[]> {
    let rows = this.readySlides.filter((row) => {
      if (!this.inDiscoveryScope(row, input)) return false;
      if (input.category && row.category !== input.category) return false;
      if (input.aspectRatio && row.aspectRatio !== input.aspectRatio) return false;
      if (input.tags?.length) {
        const tags = input.tags.map((t) => t.toLowerCase());
        if (!tags.every((tag) => row.aliases.some((a) => a.toLowerCase() === tag))) {
          return false;
        }
      }
      if (input.query?.trim()) {
        const q = input.query.trim().toLowerCase();
        const haystack = [row.displayName, row.category, ...row.aliases].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sort = input.sort ?? "relevance";
    if (sort === "newest") {
      rows = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sort === "name") {
      rows = [...rows].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return rows;
  }

  async listAllReadySlides(input: { organizationId?: string | null }): Promise<ReadySlideRow[]> {
    return this.searchReadySlides({ organizationId: input.organizationId });
  }
}
