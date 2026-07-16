import { Toaster } from "@deck-pack/ui/components/system/sonner";
import { ThemeProvider } from "@deck-pack/ui/components/system/theme-provider";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
  type RouterHistory,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { WebCanvasProvider } from "@/contexts/web-canvas-context";
import { ShortcutBindingsProvider } from "@/providers/shortcut-bindings-provider";
import { routeTree } from "@/routeTree.gen";
import { createAuthClient } from "@/utils/auth";

import type { AppShellMode, AssetsRoute } from "./routes";
import "./register-router";

const layoutSizes = {
  office: "h-[700px] w-[400px] overflow-hidden border bg-background",
  web: "h-[800px] w-[1200px] overflow-hidden border bg-background",
  panel: "h-[700px] w-[480px] overflow-hidden border bg-background",
} as const;

function createStoryRouter(initialEntry: AssetsRoute) {
  const authClient = createAuthClient();

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }) as RouterHistory,
    defaultPreload: "intent",
    scrollRestoration: false,
    context: { authClient },
  });
}

export function StoryProviders({
  children,
  layout = "panel",
}: {
  children: ReactNode;
  layout?: keyof typeof layoutSizes;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <EnvironmentProvider>
        <WebCanvasProvider>
          <ShortcutBindingsProvider>
            <div className={layoutSizes[layout]}>{children}</div>
            <Toaster richColors />
          </ShortcutBindingsProvider>
        </WebCanvasProvider>
      </EnvironmentProvider>
    </ThemeProvider>
  );
}

export function AssetsRouterFrame({
  initialRoute,
  layout,
}: {
  initialRoute: AssetsRoute;
  layout: AppShellMode | "panel";
}) {
  const router = useMemo(() => createStoryRouter(initialRoute), [initialRoute]);

  return (
    <StoryProviders layout={layout === "panel" ? "panel" : layout}>
      <RouterProvider router={router} />
    </StoryProviders>
  );
}

export function withAssetsPanel(Story: () => ReactNode) {
  return (
    <StoryProviders layout="panel">
      <Story />
    </StoryProviders>
  );
}

export const layoutStoryGlobals = {
  assetsPage: {
    description: "In-app page (same routes as the navigation drawer)",
    toolbar: {
      title: "Page",
      icon: "component",
      items: [
        { value: "flags", title: "Flags" },
        { value: "logos", title: "Logos" },
        { value: "icons", title: "Icons" },
        { value: "photos", title: "Photos" },
        { value: "balls", title: "Balls" },
        { value: "slides", title: "Slides" },
        { value: "shapes", title: "Shapes" },
        { value: "agenda", title: "Agenda" },
        { value: "check", title: "Check" },
        { value: "format", title: "Format" },
        { value: "themes", title: "Themes" },
        { value: "account", title: "Account" },
        { value: "shortcuts", title: "Shortcuts" },
      ],
      dynamicTitle: true,
    },
  },
} as const;

export const layoutStoryInitialGlobals = {
  assetsPage: "flags",
} as const;
