import { describe, expect, it } from "vitest";

import { createDocumentSettingsPort } from "./document-settings";

function createMockOffice() {
  const store = new Map<string, unknown>();

  const settings = {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => {
      store.set(key, value);
    },
    remove: (key: string) => {
      store.delete(key);
    },
    saveAsync: (callback: (result: { status: string; error?: { message?: string } }) => void) => {
      callback({ status: "succeeded" });
    },
  };

  return {
    context: {
      document: {
        settings,
      },
    },
    AsyncResultStatus: {
      Failed: "failed",
      Succeeded: "succeeded",
    },
    store,
  };
}

describe("document-settings", () => {
  it("round-trips values through the settings port", async () => {
    const Office = createMockOffice();
    const port = createDocumentSettingsPort(Office as never);

    port.set("deck-pack.agenda.config", { revision: 1 });
    await port.saveAsync();

    expect(port.get("deck-pack.agenda.config")).toEqual({ revision: 1 });
    port.remove("deck-pack.agenda.config");
    expect(port.get("deck-pack.agenda.config")).toBeUndefined();
  });
});
