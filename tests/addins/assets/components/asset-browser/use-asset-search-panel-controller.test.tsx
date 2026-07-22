import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useAssetSearchPanelController } from "@/hooks/asset-browser/use-asset-search-panel-controller";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { WebCanvasProvider } from "@/contexts/web-canvas-context";
import { AppHotkeysProvider } from "@/providers/app-hotkeys-provider";
import { ShortcutBindingsProvider } from "@/providers/shortcut-bindings-provider";
import { ServicesProvider } from "@/services/services-context";
import { mockFlagDetails, mockFlagSearch } from "@fixtures/asset-search";
import { createTestServices } from "@fixtures/test-services";
import { Flag } from "@phosphor-icons/react";

function createWrapper(services = createTestServices()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ServicesProvider services={services}>
        <EnvironmentProvider>
          <WebCanvasProvider>
            <AppHotkeysProvider>
              <ShortcutBindingsProvider>{children}</ShortcutBindingsProvider>
            </AppHotkeysProvider>
          </WebCanvasProvider>
        </EnvironmentProvider>
      </ServicesProvider>
    );
  };
}

const baseProps = {
  assetType: "flag" as const,
  assetLabel: "Flag",
  headerText: "Search flags",
  searchPlaceholder: "Search flags...",
  icon: Flag,
  noResultsDescription: "No results",
  noVariantsDescription: "No variants",
  search: mockFlagSearch,
  getDetails: mockFlagDetails,
};

describe("useAssetSearchPanelController", () => {
  it("exposes search flow state for the asset search panel view", () => {
    const { result } = renderHook(() => useAssetSearchPanelController(baseProps), {
      wrapper: createWrapper(),
    });

    expect(result.current.headerText).toBe("Search flags");
    expect(result.current.searchPlaceholder).toBe("Search flags...");
    expect(typeof result.current.flow.setSearchValue).toBe("function");
  });

  it("uses test services insertion strategy when inserting", () => {
    const insert = vi.fn(async () => undefined);
    const services = createTestServices({
      insertion: {
        createOfficeStrategy: () => ({
          verb: "Insert",
          insertingVerb: "Inserting...",
          insert,
        }),
        createCanvasStrategy: () => ({
          verb: "Insert",
          insertingVerb: "Inserting...",
          insert,
        }),
      },
    });

    const { result } = renderHook(() => useAssetSearchPanelController(baseProps), {
      wrapper: createWrapper(services),
    });

    expect(result.current.insertLabel).toBe("Insert");
  });
});
