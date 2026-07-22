import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo } from "react";

import type { AssetPanelMode } from "@/types/asset-types";
import { ShortcutBindingsProvider } from "@/providers/shortcut-bindings-provider";
import { AssetsShell } from "@/components/shell/assets-shell";

import { StoryProviders } from "./decorators";
import "./register-router";

function createShellStoryRouter(mode: AssetPanelMode, children: ReactNode) {
  const rootRoute = createRootRoute({
    component: () => (
      <ShortcutBindingsProvider>
        <AssetsShell mode={mode}>{children}</AssetsShell>
      </ShortcutBindingsProvider>
    ),
  });

  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

export function AssetsShellFrame({
  mode,
  children,
  layout = mode === "office" ? "office" : "panel",
}: {
  mode: AssetPanelMode;
  children: ReactNode;
  layout?: "office" | "web" | "panel";
}) {
  const router = useMemo(() => createShellStoryRouter(mode, children), [mode, children]);

  return (
    <StoryProviders layout={layout}>
      <RouterProvider router={router} />
    </StoryProviders>
  );
}
