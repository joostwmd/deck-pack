import {
  executeFormattingCommand,
  officeClient,
  readSelectedShapes,
  runPowerPoint,
  subscribeToSelectionChanges,
} from "@deck-pack/office-js";

import { createCanvasStrategy, officeInsertionStrategyWithTracker } from "@/lib/insertion-strategy";
import { createAddinSignOutStrategy } from "@/auth/create-addin-sign-out-strategy";
import { getAuthClient } from "@/utils/auth";
import { getTrpcClient } from "@/utils/trpc";

import type {
  AppServices,
  AssetStores,
  AgendaStore,
  BrandProfileStore,
  InsertionStore,
  ShortcutStore,
} from "./types";

function createShortcutStore(api: ReturnType<typeof getTrpcClient>): ShortcutStore {
  return {
    list: () => api.shortcuts.list.query(),
    setOverride: (input) => api.shortcuts.setOverride.mutate(input),
    resetOverride: (input) => api.shortcuts.resetOverride.mutate(input),
    resetAll: () => api.shortcuts.resetAll.mutate(),
  };
}

function createAssetStores(api: ReturnType<typeof getTrpcClient>): AssetStores {
  const externalListSearch = (asset: "logos" | "icons") => ({
    search: async (query: string) => {
      const response = await api.assets[asset].search.query({ query });
      return response.results;
    },
    getDetails: (externalId: string) => api.assets[asset].getDetails.query({ externalId }),
  });

  return {
    flags: {
      search: async (query: string, options?: { internalOnly?: boolean }) => {
        const response = await api.assets.flags.search.query({
          query,
          internalOnly: options?.internalOnly,
        });
        return response.results;
      },
      getDetails: (externalId: string) => api.assets.flags.getDetails.query({ externalId }),
    },
    logos: externalListSearch("logos"),
    icons: externalListSearch("icons"),
    photos: {
      search: (input) => api.assets.photos.search.query(input),
    },
    slides: {
      search: (input) => api.assets.slides.search.query(input),
    },
    shapes: {
      search: (input) => api.assets.shapes.search.query(input),
    },
  };
}

function createBrandProfileStore(api: ReturnType<typeof getTrpcClient>): BrandProfileStore {
  return {
    list: () => api.brandProfiles.list.query(),
    get: (profileId, versionId) => api.brandProfiles.get.query({ profileId, versionId }),
    create: (input) => api.brandProfiles.create.mutate(input),
    update: (input) => api.brandProfiles.update.mutate(input),
    duplicate: (input) => api.brandProfiles.duplicate.mutate(input),
    setDefault: (profileId) => api.brandProfiles.setDefault.mutate({ profileId }),
    archive: (profileId) => api.brandProfiles.archive.mutate({ profileId }),
  };
}

function createAgendaStore(api: ReturnType<typeof getTrpcClient>): AgendaStore {
  return {
    sync: (input) => api.agenda.sync.mutate(input),
    get: (documentAgendaId) => api.agenda.get.query({ documentAgendaId }),
  };
}

function createInsertionStore(api: ReturnType<typeof getTrpcClient>): InsertionStore {
  return {
    track: ({ assetType, externalId, client, metadata }) => {
      void api.addin.insertions.track
        .mutate({ assetType, externalId, client, metadata })
        .catch((error) => {
          console.error("Failed to track asset insertion:", error);
        });
    },
  };
}

export function createAppServices(): AppServices {
  const api = getTrpcClient();
  const office: AppServices["office"] = {
    readSelectedShapes,
    subscribeToSelectionChanges,
    executeFormattingCommand,
    runPowerPoint,
    insertImageWithMetadata: (base64, metadata) =>
      officeClient.insertImageWithMetadata(base64, metadata),
    insertSvgWithMetadata: (svg, metadata) => officeClient.insertSvgWithMetadata(svg, metadata),
    insertSlidesFromBase64: (base64, options) =>
      officeClient.insertSlidesFromBase64(base64, options),
  };

  return {
    auth: getAuthClient(),
    signOut: createAddinSignOutStrategy(),
    assets: createAssetStores(api),
    brandProfiles: createBrandProfileStore(api),
    agenda: createAgendaStore(api),
    insertions: createInsertionStore(api),
    office,
    insertion: {
      createOfficeStrategy: (officeDeps, tracker) =>
        officeInsertionStrategyWithTracker(officeDeps, tracker),
      createCanvasStrategy: (webCanvas, tracker) => createCanvasStrategy(webCanvas, tracker),
    },
    shortcutStore: createShortcutStore(api),
  };
}
