import { Toaster } from "@deck-pack/ui/components/system/sonner";
import { AppErrorBoundary } from "@deck-pack/observability";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@deck-pack/ui/components/system/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";
import { createAppAuthClient } from "@deck-pack/auth/client";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
  authClient: ReturnType<typeof createAppAuthClient>;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "DeckPack — Portal",
      },
      {
        name: "description",
        content: "DeckPack organization dashboard",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <AppErrorBoundary>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="deck-pack-portal-theme"
      >
        <div className="grid h-svh min-h-0 grid-rows-[1fr] [&>*]:min-h-0">
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </AppErrorBoundary>
  );
}
