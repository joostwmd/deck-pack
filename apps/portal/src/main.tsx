import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { env } from "@deck-pack/env/web";
import { initBrowserSentry } from "@deck-pack/observability";
import { Loader } from "@deck-pack/ui/components/system/loader";
import { ServicesProvider } from "./services/services-context";
import { routeTree } from "./routeTree.gen";
import { authClient } from "./utils/auth";
import { queryClient, trpc } from "./utils/trpc";

initBrowserSentry({
  dsn: env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  app: "portal",
  tracePropagationTargets: [env.VITE_SERVER_URL],
});

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultPendingComponent: () => <Loader />,
  context: { trpc, queryClient, authClient },
  Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
    return (
      <ServicesProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ServicesProvider>
    );
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
