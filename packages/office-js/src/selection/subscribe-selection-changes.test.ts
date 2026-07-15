import { describe, expect, it, vi } from "vitest";

import { subscribeToSelectionChanges } from "./subscribe-selection-changes";

describe("subscribeToSelectionChanges", () => {
  it("registers and removes a single selection handler", async () => {
    const handlers = new Map<string, () => void>();
    const officeContext = {
      document: {
        addHandlerAsync: vi.fn((eventType, handler, callback) => {
          handlers.set(eventType, handler);
          callback?.({ status: "succeeded" });
        }),
        removeHandlerAsync: vi.fn((_eventType, options, callback) => {
          expect(handlers.get("documentSelectionChanged")).toBe(options.handler);
          callback?.({ status: "succeeded" });
        }),
      },
    };

    const onChange = vi.fn();
    const subscription = await subscribeToSelectionChanges(officeContext, onChange);
    expect(officeContext.document.addHandlerAsync).toHaveBeenCalledTimes(1);

    handlers.get("documentSelectionChanged")?.();
    expect(onChange).toHaveBeenCalledTimes(1);

    await subscription.unsubscribe();
    expect(officeContext.document.removeHandlerAsync).toHaveBeenCalledTimes(1);
  });
});
