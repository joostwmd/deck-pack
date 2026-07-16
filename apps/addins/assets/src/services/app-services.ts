import {
  executeFormattingCommand,
  officeClient,
  readSelectedShapes,
  runPowerPoint,
  subscribeToSelectionChanges,
} from "@deck-pack/office-js";

import { createCanvasStrategy, officeInsertionStrategyWithTracker } from "@/lib/insertion-strategy";
import { getAuthClient } from "@/utils/auth";
import { getTrpcClient } from "@/utils/trpc";

import type { AppServices, ShortcutStore } from "./types";

function createShortcutStore(): ShortcutStore {
  const api = getTrpcClient();

  return {
    list: () => api.shortcuts.list.query(),
    setOverride: (input) => api.shortcuts.setOverride.mutate(input),
    resetOverride: (input) => api.shortcuts.resetOverride.mutate(input),
    resetAll: () => api.shortcuts.resetAll.mutate(),
  };
}

export function createAppServices(): AppServices {
  const api = getTrpcClient();

  return {
    api,
    auth: getAuthClient(),
    office: {
      readSelectedShapes,
      subscribeToSelectionChanges,
      executeFormattingCommand,
      runPowerPoint,
      insertImageWithMetadata: (base64, metadata) =>
        officeClient.insertImageWithMetadata(base64, metadata),
      insertSvgWithMetadata: (svg, metadata) => officeClient.insertSvgWithMetadata(svg, metadata),
      insertSlidesFromBase64: (base64, options) =>
        officeClient.insertSlidesFromBase64(base64, options),
    },
    insertion: {
      createOfficeStrategy: (tracker) => officeInsertionStrategyWithTracker(tracker),
      createCanvasStrategy: (webCanvas, tracker) => createCanvasStrategy(webCanvas, tracker),
    },
    shortcutStore: createShortcutStore(),
  };
}
