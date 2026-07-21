import type { AgendaConfigV1, AgendaEventType } from "@deck-pack/agenda";
import type { BrandProfileConfiguration } from "@deck-pack/brand-compliance";
import type { AuthClient } from "@deck-pack/auth/client";
import type { SignOutStrategy } from "@deck-pack/auth/microsoft-sign-in";
import type {
  executeFormattingCommand,
  readSelectedShapes,
  runPowerPoint,
  subscribeToSelectionChanges,
} from "@deck-pack/office-js";
import type { ShortcutId, ShortcutOverride } from "@deck-pack/shortcuts";

import type { WebCanvasContextValue } from "@/contexts/web-canvas-context";
import type { PhotoFilters, PhotoSearchResponse } from "@/components/photos/types";
import type { ShapeSearchResponse } from "@/components/shapes/types";
import type { SlideAspectRatio, SlideSearchResponse, SlideSort } from "@/components/slides/types";
import type { AssetDetailsResponse, AssetListItem, AssetType } from "@/types/asset-types";
import type { InsertionStrategy } from "@/utils/insertion-strategy";

export type { AuthClient };

export interface ShortcutOverrideRecord {
  shortcutId: ShortcutId;
  hotkey: string;
  isCustomized: boolean;
  schemaVersion: number;
}

export interface ShortcutStore {
  list: () => Promise<{ overrides: ShortcutOverride[] }>;
  setOverride: (input: {
    shortcutId: ShortcutId;
    hotkey: string;
  }) => Promise<ShortcutOverrideRecord>;
  resetOverride: (input: { shortcutId: ShortcutId }) => Promise<unknown>;
  resetAll: () => Promise<unknown>;
}

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

export interface BrandProfileSummary {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  activeVersionId: string | null;
  versionNumber: number | null;
  schemaVersion: number | null;
  configuration: BrandProfileConfiguration | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandProfileDetail {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  activeVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: {
    id: string;
    version: number;
    schemaVersion: number;
    configuration: BrandProfileConfiguration;
    createdAt: Date;
  } | null;
}

export interface BrandProfileStore {
  list: () => Promise<BrandProfileSummary[]>;
  get: (profileId: string, versionId?: string) => Promise<BrandProfileDetail>;
  create: (input: {
    name: string;
    description?: string | null;
    isDefault?: boolean;
    configuration: BrandProfileConfiguration;
  }) => Promise<BrandProfileDetail>;
  update: (input: {
    profileId: string;
    name?: string;
    description?: string | null;
    configuration: BrandProfileConfiguration;
  }) => Promise<BrandProfileDetail>;
  duplicate: (input: { profileId: string; name: string }) => Promise<BrandProfileDetail>;
  setDefault: (profileId: string) => Promise<{ id: string; isDefault: boolean }>;
  archive: (profileId: string) => Promise<{ id: string }>;
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
  shortcutStore: ShortcutStore;
}
