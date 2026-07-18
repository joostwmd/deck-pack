// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { WebCanvasProvider } from "@/contexts/web-canvas-context";
import { useInsertionStrategy } from "@/hooks/use-insertion-strategy";
import { ServicesProvider } from "@/services/services-context";
import { createTestServices } from "@fixtures/test-services";

function createWrapper(services = createTestServices()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ServicesProvider services={services}>
        <EnvironmentProvider>
          <WebCanvasProvider>{children}</WebCanvasProvider>
        </EnvironmentProvider>
      </ServicesProvider>
    );
  };
}

describe("useInsertionStrategy", () => {
  it("returns a canvas strategy in web environments with a canvas context", () => {
    const createCanvasStrategy = vi.fn(() => ({
      verb: "Add to canvas",
      insertingVerb: "Adding...",
      insert: vi.fn(async () => undefined),
    }));
    const services = createTestServices({
      insertion: {
        createCanvasStrategy,
        createOfficeStrategy: vi.fn(),
      },
    });

    const { result } = renderHook(() => useInsertionStrategy(), {
      wrapper: createWrapper(services),
    });

    expect(createCanvasStrategy).toHaveBeenCalled();
    expect(result.current?.verb).toBe("Add to canvas");
  });

  it("returns null when no canvas context is available outside office", () => {
    const services = createTestServices();

    const { result } = renderHook(() => useInsertionStrategy(), {
      wrapper: ({ children }) => (
        <ServicesProvider services={services}>
          <EnvironmentProvider>{children}</EnvironmentProvider>
        </ServicesProvider>
      ),
    });

    expect(result.current).toBeNull();
  });
});
