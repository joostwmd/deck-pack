import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { Loader } from "@deck-pack/ui/components/system/loader";
import { ServicesProvider } from "./services/services-context";
import { routeTree } from "./routeTree.gen";
import { queryClient, trpc } from "./utils/trpc";
import { authClient } from "./utils/auth";

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
