import { sentryVitePlugin } from "@sentry/vite-plugin";

export function createSentryVitePlugins() {
  const authToken = process.env.SENTRY_AUTH_TOKEN;

  if (!authToken) {
    return [];
  }

  return [
    sentryVitePlugin({
      org: process.env.SENTRY_ORG ?? "",
      project: process.env.SENTRY_PROJECT ?? "",
      authToken,
    }),
  ];
}
