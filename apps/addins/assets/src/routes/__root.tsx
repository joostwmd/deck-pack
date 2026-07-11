import { Toaster } from "@deck-pack/ui/components/system/sonner";
import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { OfficeProvider } from "@/contexts/OfficeContext";
import { AppHotkeysProvider } from "@/providers/app-hotkeys-provider";

import "../index.css";

export const Route = createRootRoute({
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
  return (
    <ErrorBoundary>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        storageKey="deck-pack-addin-one-theme"
      >
        <OfficeProvider>
          <EnvironmentProvider>
            <AppHotkeysProvider>
              <Outlet />
            </AppHotkeysProvider>
          </EnvironmentProvider>
        </OfficeProvider>
        <Toaster />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </ErrorBoundary>
  );
}
