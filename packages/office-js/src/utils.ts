import type { OfficeReadyInfo } from "./types";

function getOfficeGlobal(): typeof Office | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { Office?: typeof Office }).Office;
}

export function isOfficeReady(): boolean {
  return getOfficeGlobal() !== undefined;
}

export function isOfficeDocumentAvailable(): boolean {
  const Office = getOfficeGlobal();
  return Office?.context?.document !== undefined;
}

export function detectOffice(): Promise<boolean> {
  return new Promise((resolve) => {
    const Office = getOfficeGlobal();

    if (!Office) {
      resolve(false);
      return;
    }

    if (Office.context?.document) {
      resolve(true);
      return;
    }

    Office.onReady(() => {
      resolve(!!Office.context?.document);
    });
  });
}

export function getOfficeReadyInfo(): Promise<OfficeReadyInfo | null> {
  return new Promise((resolve) => {
    const Office = getOfficeGlobal();

    if (!Office) {
      resolve(null);
      return;
    }

    Office.onReady((info) => {
      resolve({
        host: info.host,
        platform: info.platform,
      });
    });
  });
}

export function isPowerPointApiAvailable(minVersion = "1.5"): boolean {
  const Office = getOfficeGlobal();

  if (!Office?.context?.requirements) {
    return false;
  }

  return Office.context.requirements.isSetSupported("PowerPointApi", minVersion);
}

function getOfficeOrThrow(): typeof Office {
  const Office = getOfficeGlobal();

  if (!Office?.context?.document) {
    throw new Error("Office.js is not available");
  }

  return Office;
}

function getPowerPointOrThrow(): typeof PowerPoint {
  const PowerPoint = (window as Window & { PowerPoint?: typeof PowerPoint }).PowerPoint;

  if (!PowerPoint) {
    throw new Error("PowerPoint API is not available");
  }

  return PowerPoint;
}

export async function runPowerPoint<T>(
  callback: (context: PowerPoint.RequestContext) => Promise<T>,
): Promise<T> {
  const PowerPoint = getPowerPointOrThrow();
  return PowerPoint.run(callback);
}

export async function runOfficeAsync<T>(
  callback: (office: typeof Office) => Promise<T>,
): Promise<T> {
  const Office = getOfficeOrThrow();
  return callback(Office);
}
