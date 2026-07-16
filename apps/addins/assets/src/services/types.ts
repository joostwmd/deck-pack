import type { AppRouter } from "@deck-pack/api/routers/index";
import type { createAppAuthClient } from "@deck-pack/auth/client";
import type {
  executeFormattingCommand,
  readSelectedShapes,
  runPowerPoint,
  subscribeToSelectionChanges,
} from "@deck-pack/office-js";
import type { createTrpcBrowserBundle } from "@deck-pack/trpc-client";
import type { ShortcutId, ShortcutOverride } from "@deck-pack/shortcuts";

import type { WebCanvasContextValue } from "@/contexts/web-canvas-context";
import type { AssetType } from "@/lib/asset-types";
import type { InsertionStrategy } from "@/lib/insertion-strategy";

export type TrpcClient = ReturnType<typeof createTrpcBrowserBundle<AppRouter>>["trpcClient"];
export type AuthClient = ReturnType<typeof createAppAuthClient>;

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

export interface OfficeService {
  readSelectedShapes: typeof readSelectedShapes;
  subscribeToSelectionChanges: typeof subscribeToSelectionChanges;
  executeFormattingCommand: typeof executeFormattingCommand;
  runPowerPoint: typeof runPowerPoint;
  insertImageWithMetadata: (
    base64: string,
    metadata: Record<string, string>,
  ) => Promise<unknown>;
  insertSvgWithMetadata: (svg: string, metadata: Record<string, string>) => Promise<unknown>;
  insertSlidesFromBase64: (
    base64: string,
    options?: Parameters<typeof import("@deck-pack/office-js").officeClient.insertSlidesFromBase64>[1],
  ) => Promise<unknown>;
}

export interface InsertionTracker {
  track: (input: {
    assetType: AssetType;
    externalId: string;
    client: "office" | "web";
    metadata: Record<string, unknown>;
  }) => void;
}

export interface InsertionService {
  createOfficeStrategy: (tracker: InsertionTracker) => InsertionStrategy;
  createCanvasStrategy: (
    webCanvas: WebCanvasContextValue,
    tracker: InsertionTracker,
  ) => InsertionStrategy;
}

export interface AppServices {
  api: TrpcClient;
  auth: AuthClient;
  office: OfficeService;
  insertion: InsertionService;
  shortcutStore: ShortcutStore;
}
