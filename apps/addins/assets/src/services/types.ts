import type { AgendaConfigV1, AgendaEventType } from "@deck-pack/agenda";
import type { AuthClient } from "@deck-pack/auth/client";
import type { SignOutStrategy } from "@deck-pack/auth/microsoft-sign-in";
import type {
  BrandProfileDetail,
  BrandProfileStore,
  BrandProfileSummary,
} from "@deck-pack/hooks/brand-profiles";
import type {
  ShortcutOverrideRecord,
  ShortcutOverridesStore,
} from "@deck-pack/hooks/shortcut-overrides";
import type {
  executeFormattingCommand,
  readSelectedShapes,
  runPowerPoint,
  subscribeToSelectionChanges,
} from "@deck-pack/office-js";

import type { WebCanvasContextValue } from "@/contexts/web-canvas-context";
import type { PhotoFilters, PhotoSearchResponse } from "@/components/photos/types";
import type { ShapeSearchResponse } from "@/components/shapes/types";
import type { SlideAspectRatio, SlideSearchResponse, SlideSort } from "@/components/slides/types";
import type { AssetDetailsResponse, AssetListItem, AssetType } from "@/types/asset-types";
import type { InsertionStrategy } from "@/utils/insertion-strategy";

export type { AuthClient };
export type { BrandProfileDetail, BrandProfileStore, BrandProfileSummary };
export type { ShortcutOverrideRecord, ShortcutOverridesStore as ShortcutStore };

export interface AssetListSearchStore {
  search: (query: string, options?: { internalOnly?: boolean }) => Promise<AssetListItem[]>;
  getDetails: (externalId: string) => Promise<AssetDetailsResponse>;
}

export interface PhotoSearchInput {
  query: string;
  page?: number;
  orientation?: PhotoFilters["orientation"];
  size?: PhotoFilters["size"];
  color?: PhotoFilters["color"];
  locale?: PhotoFilters["locale"];
}

export interface PhotoSearchStore {
  search: (input: PhotoSearchInput) => Promise<PhotoSearchResponse>;
}

export interface SlideSearchStore {
  search: (input: {
    query?: string;
    category?: string;
    tags?: string[];
    aspectRatio?: SlideAspectRatio;
    sort?: SlideSort;
    internalOnly?: boolean;
  }) => Promise<SlideSearchResponse>;
}

export interface ShapeSearchStore {
  search: (input: { category?: string; internalOnly?: boolean }) => Promise<ShapeSearchResponse>;
}

export interface AssetStores {
  flags: AssetListSearchStore;
  logos: AssetListSearchStore;
  icons: AssetListSearchStore;
  photos: PhotoSearchStore;
  slides: SlideSearchStore;
  shapes: ShapeSearchStore;
}

export interface InsertionStore {
  track: (input: {
    assetType: AssetType;
    externalId: string;
    client: "office" | "web";
    metadata: Record<string, unknown>;
  }) => Promise<void>;
}

export interface AgendaSyncInput {
  configuration: AgendaConfigV1;
  configurationHash: string;
  eventId: string;
  eventType: AgendaEventType;
  client: "office" | "web";
  durationMs?: number;
  metadata: {
    sectionCount: number;
    generatedSlideCount: number;
  };
}

export interface AgendaStore {
  sync: (input: AgendaSyncInput) => Promise<{ instanceId: string; revision: number }>;
  get: (documentAgendaId: string) => Promise<unknown>;
}

export interface OfficeService {
  readSelectedShapes: typeof readSelectedShapes;
  subscribeToSelectionChanges: typeof subscribeToSelectionChanges;
  executeFormattingCommand: typeof executeFormattingCommand;
  runPowerPoint: typeof runPowerPoint;
  insertImageWithMetadata: (base64: string, metadata: Record<string, string>) => Promise<unknown>;
  insertSvgWithMetadata: (svg: string, metadata: Record<string, string>) => Promise<unknown>;
  insertSlidesFromBase64: (
    base64: string,
    options?: Parameters<
      typeof import("@deck-pack/office-js").officeClient.insertSlidesFromBase64
    >[1],
  ) => Promise<unknown>;
}

export interface InsertionTracker {
  track: InsertionStore["track"];
}

export interface InsertionService {
  createOfficeStrategy: (
    office: Pick<OfficeService, "insertImageWithMetadata" | "insertSvgWithMetadata">,
    tracker: InsertionTracker,
  ) => InsertionStrategy;
  createCanvasStrategy: (
    webCanvas: WebCanvasContextValue,
    tracker: InsertionTracker,
  ) => InsertionStrategy;
}

export interface AppServices {
  auth: AuthClient;
  signOut: SignOutStrategy;
  assets: AssetStores;
  brandProfiles: BrandProfileStore;
  agenda: AgendaStore;
  insertions: InsertionStore;
  office: OfficeService;
  insertion: InsertionService;
  shortcutStore: ShortcutOverridesStore;
}
