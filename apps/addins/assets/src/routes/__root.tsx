import type { AuthClient } from "@deck-pack/auth/client";
import { AppErrorBoundary } from "@deck-pack/observability";
import { Toaster } from "@deck-pack/ui/components/system/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { ThemeProvider } from "@deck-pack/ui/components/system/theme-provider";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { OfficeProvider } from "@/contexts/OfficeContext";
import { AppHotkeysProvider } from "@/providers/app-hotkeys-provider";
import { ServicesProvider } from "@/services/services-context";
import { getQueryClient } from "@/utils/trpc";

import "../index.css";

export interface RouterAddinContext {
  authClient: AuthClient;
}

export const Route = createRootRouteWithContext<RouterAddinContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "DeckPack — Add-in",
      },
      {
        name: "description",
        content: "DeckPack PowerPoint add-in",
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
  const queryClient = getQueryClient();

  return (
    <AppErrorBoundary>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        storageKey="deck-pack-addin-one-theme"
      >
        <OfficeProvider>
          <EnvironmentProvider>
            <QueryClientProvider client={queryClient}>
              <ServicesProvider>
                <AppHotkeysProvider>
                  <Outlet />
                </AppHotkeysProvider>
              </ServicesProvider>
            </QueryClientProvider>
          </EnvironmentProvider>
        </OfficeProvider>
        <Toaster />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
