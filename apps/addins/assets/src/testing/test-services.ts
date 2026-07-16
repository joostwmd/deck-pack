import type { DeepPartial } from "@/testing/deep-partial";
import type { AppServices, InsertionTracker, TrpcClient } from "@/services/types";
import {
  createTrpcAssetHandlers,
  mockFlagDetails,
  mockFlagSearch,
  mockIconDetails,
  mockIconSearch,
  mockLogoDetails,
  mockLogoSearch,
} from "@/testing/fixtures/asset-search";
import { createCanvasStrategy, officeInsertionStrategyWithTracker } from "@/lib/insertion-strategy";
import { createInsertionTracker } from "@/lib/track-asset-insertion";

const mockSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
  },
};

function createTestTracker(api: TrpcClient): InsertionTracker {
  return createInsertionTracker(api);
}

function createDefaultTestApi(): TrpcClient {
  return {
    shortcuts: {
      list: { query: async () => ({ overrides: [] }) },
      setOverride: {
        mutate: async ({
          shortcutId,
          hotkey,
        }: {
          shortcutId: string;
          hotkey: string;
        }) => ({
          shortcutId,
          hotkey,
          isCustomized: true,
          schemaVersion: 1,
        }),
      },
      resetOverride: { mutate: async () => undefined },
      resetAll: { mutate: async () => undefined },
    },
    addin: {
      flags: createTrpcAssetHandlers(mockFlagSearch, mockFlagDetails),
      logos: createTrpcAssetHandlers(mockLogoSearch, mockLogoDetails),
      icons: createTrpcAssetHandlers(mockIconSearch, mockIconDetails),
      insertions: {
        track: { mutate: async () => ({ success: true }) },
      },
    },
    brandProfiles: {
      list: { query: async () => [] },
      get: { query: async () => null },
      create: { mutate: async () => ({ id: "profile-1" }) },
      update: { mutate: async () => ({ id: "profile-1" }) },
      duplicate: { mutate: async () => ({ id: "profile-2" }) },
      setDefault: { mutate: async () => ({ success: true }) },
      archive: { mutate: async () => ({ success: true }) },
    },
    agenda: {
      sync: { mutate: async () => ({ success: true }) },
    },
  } as unknown as TrpcClient;
}

function createDefaultTestAuth(): AppServices["auth"] {
  return {
    getSession: async () => ({ data: mockSession, error: null }),
    useSession: () => ({ data: mockSession, isPending: false, error: null }),
    signOut: async () => ({ data: null, error: null }),
  } as unknown as AppServices["auth"];
}

function createDefaultTestOffice(): AppServices["office"] {
  return {
    readSelectedShapes: async () => ({ slideId: "slide-1", shapes: [] }),
    subscribeToSelectionChanges: async () => ({ unsubscribe: async () => undefined }),
    executeFormattingCommand: async () => ({ commandId: "align-left", mutationCount: 1 }),
    runPowerPoint: async (callback) => callback({} as never),
    insertImageWithMetadata: async () => undefined,
    insertSvgWithMetadata: async () => undefined,
    insertSlidesFromBase64: async () => undefined,
  };
}

export function createTestServices(overrides?: DeepPartial<AppServices>): AppServices {
  const api = (overrides?.api ?? createDefaultTestApi()) as TrpcClient;
  const tracker = createTestTracker(api);

  const insertion: AppServices["insertion"] = {
    createOfficeStrategy: (nextTracker) =>
      officeInsertionStrategyWithTracker(nextTracker ?? tracker),
    createCanvasStrategy: (webCanvas, nextTracker) =>
      createCanvasStrategy(webCanvas, nextTracker ?? tracker),
    ...(overrides?.insertion as Partial<AppServices["insertion"]>),
  };

  const shortcutStore: AppServices["shortcutStore"] = {
    list: () => api.shortcuts.list.query(),
    setOverride: (input) => api.shortcuts.setOverride.mutate(input),
    resetOverride: (input) => api.shortcuts.resetOverride.mutate(input),
    resetAll: () => api.shortcuts.resetAll.mutate(),
    ...(overrides?.shortcutStore as Partial<AppServices["shortcutStore"]>),
  };

  return {
    api,
    auth: (overrides?.auth ?? createDefaultTestAuth()) as AppServices["auth"],
    office: {
      ...createDefaultTestOffice(),
      ...(overrides?.office as Partial<AppServices["office"]>),
    },
    insertion,
    shortcutStore,
  };
}
