import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ServicesProvider } from "@/services/services-context";
import { createTestServices } from "@fixtures/test-services";

import { useBrandProfiles } from "@/hooks/shared/use-brand-profiles";

function createWrapper(services = createTestServices()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServicesProvider services={services}>{children}</ServicesProvider>
      </QueryClientProvider>
    );
  };
}

describe("useBrandProfiles", () => {
  it("loads profiles from injected brand profile store", async () => {
    const list = vi.fn(async () => [
      {
        id: "profile-1",
        name: "Default",
        description: null,
        isDefault: true,
        activeVersionId: null,
        versionNumber: null,
        schemaVersion: null,
        configuration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const services = createTestServices({
      brandProfiles: {
        list,
      },
    });

    const { result } = renderHook(() => useBrandProfiles(), {
      wrapper: createWrapper(services),
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(list).toHaveBeenCalled();
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0]?.name).toBe("Default");
  });
});
