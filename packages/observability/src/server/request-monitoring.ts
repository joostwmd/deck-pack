import { useApitally } from "apitally/hono";
import type { Hono } from "hono";

export interface RequestMonitoring {
  // Hono app typing varies by AppEnv; keep this duck-typed at the package boundary.
  register(app: Hono): void;
}

export class ApitallyRequestMonitoring implements RequestMonitoring {
  constructor(private readonly options: { clientId: string; env: string }) {}

  register(app: Hono): void {
    const registerApitally = useApitally as unknown as (
      honoApp: Hono,
      config: Parameters<typeof useApitally>[1],
    ) => void;

    registerApitally(app, {
      clientId: this.options.clientId,
      env: this.options.env,
      requestLogging: {
        enabled: true,
        logRequestHeaders: false,
        logRequestBody: false,
        logResponseHeaders: false,
        logResponseBody: false,
        captureLogs: true,
      },
    });
  }
}

export class NoopRequestMonitoring implements RequestMonitoring {
  register(): void {}
}

export function createRequestMonitoring(options: {
  clientId: string | undefined;
  env: string;
}): RequestMonitoring {
  if (!options.clientId) return new NoopRequestMonitoring();
  return new ApitallyRequestMonitoring({ clientId: options.clientId, env: options.env });
}
