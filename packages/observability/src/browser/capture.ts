import * as Sentry from "@sentry/react";

export type CaptureClientExceptionContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

export function captureClientException(
  error: unknown,
  context?: CaptureClientExceptionContext,
): void {
  Sentry.withScope((scope) => {
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
