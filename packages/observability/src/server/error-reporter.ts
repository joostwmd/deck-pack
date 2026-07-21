import * as Sentry from "@sentry/node";

export type CaptureExceptionContext = {
  requestId?: string | null;
  userId?: string | null;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

export interface ErrorReporter {
  captureException(error: unknown, context?: CaptureExceptionContext): void;
}

export class SentryErrorReporter implements ErrorReporter {
  constructor(options: { dsn: string; environment: string }) {
    Sentry.init({
      dsn: options.dsn,
      environment: options.environment,
      enabled: true,
      tracesSampleRate: options.environment === "production" ? 0.1 : 1.0,
    });
  }

  captureException(error: unknown, context?: CaptureExceptionContext): void {
    Sentry.withScope((scope) => {
      if (context?.requestId) {
        scope.setTag("requestId", context.requestId);
      }
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context?.tags) {
        for (const [key, value] of Object.entries(context.tags)) {
          scope.setTag(key, value);
        }
      }
      if (context?.extra) {
        for (const [key, value] of Object.entries(context.extra)) {
          scope.setExtra(key, value);
        }
      }
      Sentry.captureException(error);
    });
  }
}

export class NoopErrorReporter implements ErrorReporter {
  captureException(): void {}
}

export function createErrorReporter(options: {
  dsn: string | undefined;
  environment: string;
}): ErrorReporter {
  if (!options.dsn) return new NoopErrorReporter();
  return new SentryErrorReporter({ dsn: options.dsn, environment: options.environment });
}
