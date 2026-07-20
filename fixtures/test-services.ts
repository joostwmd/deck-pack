import type { SlideAspectRatio } from "@/components/slides/types";
import type { AppServices, AssetListSearchStore } from "@/services/types";
import { createCanvasStrategy, officeInsertionStrategyWithTracker } from "@/lib/insertion-strategy";
import { createInsertionTracker } from "@/lib/track-asset-insertion";

import type { DeepPartial } from "@fixtures/deep-partial";
import {
  mockFlagDetails,
  mockFlagSearch,
  mockIconDetails,
  mockIconSearch,
  mockLogoDetails,
  mockLogoSearch,
} from "@fixtures/asset-search";

const mockSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
  },
};

function createListSearchStore(
  search: (query: string) => Promise<import("@/types/asset-types").AssetListItem[]>,
  getDetails: (id: string) => Promise<import("@/types/asset-types").AssetDetailsResponse>,
): AssetListSearchStore {
  return { search, getDetails };
}

function createDefaultAssets(): AppServices["assets"] {
  return {
    flags: createListSearchStore(mockFlagSearch, mockFlagDetails),
    logos: createListSearchStore(mockLogoSearch, mockLogoDetails),
    icons: createListSearchStore(mockIconSearch, mockIconDetails),
    photos: {
      search: async () => ({
        results: [],
        page: 1,
        perPage: 20,
        totalResults: 0,
        hasNextPage: false,
      }),
    },
    slides: {
      search: async () => ({
        results: [],
        total: 0,
        facets: {
          categories: [],
          tags: [],
          aspectRatios: ["16:9", "4:3"] as SlideAspectRatio[],
        },
      }),
    },
    shapes: { search: async () => ({ results: [], total: 0, facets: { categories: [] } }) },
  };
}

function createDefaultBrandProfiles(): AppServices["brandProfiles"] {
  return {
    list: async () => [],
    get: async () => {
      throw new Error("not found");
    },
    create: async () => ({ id: "profile-1" }) as never,
    update: async () => ({ id: "profile-1" }) as never,
    duplicate: async () => ({ id: "profile-2" }) as never,
    setDefault: async () => ({ id: "profile-1", isDefault: true }),
    archive: async () => ({ id: "profile-1" }),
  };
}

function createDefaultAgenda(): AppServices["agenda"] {
  return {
    sync: async () => ({ instanceId: "agenda-1", revision: 1 }),
    get: async () => null,
  };
}

function createDefaultInsertions(): AppServices["insertions"] {
  return {
    track: () => undefined,
  };
}

function createDefaultSignOut(): AppServices["signOut"] {
  return {
    signOut: async () => undefined,
  };
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

function createDefaultShortcutStore(): AppServices["shortcutStore"] {
  return {
    list: async () => ({ overrides: [] }),
    setOverride: async ({ shortcutId, hotkey }) => ({
      shortcutId,
      hotkey,
      isCustomized: true,
      schemaVersion: 1,
    }),
    resetOverride: async () => undefined,
    resetAll: async () => undefined,
  };
}

export function createTestServices(overrides?: DeepPartial<AppServices>): AppServices {
  const insertions = {
    ...createDefaultInsertions(),
    ...(overrides?.insertions as Partial<AppServices["insertions"]>),
  };
  const office = {
    ...createDefaultTestOffice(),
    ...(overrides?.office as Partial<AppServices["office"]>),
  };
  const tracker = createInsertionTracker(insertions);

  const insertion: AppServices["insertion"] = {
    createOfficeStrategy: (officeDeps, nextTracker) =>
      officeInsertionStrategyWithTracker(officeDeps, nextTracker ?? tracker),
    createCanvasStrategy: (webCanvas, nextTracker) =>
      createCanvasStrategy(webCanvas, nextTracker ?? tracker),
    ...(overrides?.insertion as Partial<AppServices["insertion"]>),
  };

  return {
    auth: (overrides?.auth ?? createDefaultTestAuth()) as AppServices["auth"],
    signOut: (overrides?.signOut ?? createDefaultSignOut()) as AppServices["signOut"],
    assets: {
      ...createDefaultAssets(),
      ...(overrides?.assets as Partial<AppServices["assets"]>),
    },
    brandProfiles: {
      ...createDefaultBrandProfiles(),
      ...(overrides?.brandProfiles as Partial<AppServices["brandProfiles"]>),
    },
    agenda: {
      ...createDefaultAgenda(),
      ...(overrides?.agenda as Partial<AppServices["agenda"]>),
    },
    insertions,
    office,
    insertion,
    shortcutStore: {
      ...createDefaultShortcutStore(),
      ...(overrides?.shortcutStore as Partial<AppServices["shortcutStore"]>),
    },
  };
}
