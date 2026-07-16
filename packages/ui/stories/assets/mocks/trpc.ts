import {
  createTrpcAssetHandlers,
  mockEmptySearch,
  mockFailingSearch,
  mockFlagDetails,
  mockFlagSearch,
  mockIconDetails,
  mockIconSearch,
  mockLogoDetails,
  mockLogoSearch,
} from "../fixtures/asset-search";

export const trpcClient = {
  shortcuts: {
    list: {
      query: async () => ({ overrides: [] as const }),
    },
    save: {
      mutate: async () => ({ success: true }),
    },
    reset: {
      mutate: async () => ({ success: true }),
    },
    resetAll: {
      mutate: async () => ({ success: true }),
    },
  },
  addin: {
    flags: createTrpcAssetHandlers(mockFlagSearch, mockFlagDetails),
    logos: createTrpcAssetHandlers(mockLogoSearch, mockLogoDetails),
    icons: createTrpcAssetHandlers(mockIconSearch, mockIconDetails),
  },
};

export function createTrpcClient() {
  return {
    trpcClient,
    queryClient: {
      invalidateQueries: async () => undefined,
    },
  };
}

export function getTrpcClient() {
  return trpcClient;
}

export { mockEmptySearch, mockFailingSearch, mockFlagDetails, mockFlagSearch };
