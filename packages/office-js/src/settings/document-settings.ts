import { runOfficeAsync } from "../utils";

export type DocumentSettingsPort = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  remove: (key: string) => void;
  saveAsync: () => Promise<void>;
};

function getSettingsPort(Office: typeof globalThis.Office): DocumentSettingsPort {
  const settings = Office.context.document.settings;

  return {
    get: (key) => settings.get(key),
    set: (key, value) => {
      settings.set(key, value);
    },
    remove: (key) => {
      settings.remove(key);
    },
    saveAsync: () =>
      new Promise((resolve, reject) => {
        settings.saveAsync((result) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            reject(new Error(result.error?.message ?? "Failed to save document settings"));
            return;
          }

          resolve();
        });
      }),
  };
}

export async function loadDocumentSetting<T>(key: string): Promise<T | null> {
  return runOfficeAsync(async (Office) => {
    const value = getSettingsPort(Office).get(key);
    return (value ?? null) as T | null;
  });
}

export async function saveDocumentSetting(key: string, value: unknown): Promise<void> {
  return runOfficeAsync(async (Office) => {
    const port = getSettingsPort(Office);
    port.set(key, value);
    await port.saveAsync();
  });
}

export async function removeDocumentSetting(key: string): Promise<void> {
  return runOfficeAsync(async (Office) => {
    const port = getSettingsPort(Office);
    port.remove(key);
    await port.saveAsync();
  });
}

export function createDocumentSettingsPort(Office: typeof globalThis.Office): DocumentSettingsPort {
  return getSettingsPort(Office);
}
