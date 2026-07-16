import "./router-register";

import { detectOffice } from "@deck-pack/office-js";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { setOfficeBearerMode } from "./auth/office-auth-mode";
import { Loader } from "@deck-pack/ui/components/system/loader";

function getInitialEntry() {
  const path = window.location.pathname === "/index.html" ? "/" : window.location.pathname;
  return `${path}${window.location.search}${window.location.hash}`;
}

async function bootstrap() {
  setOfficeBearerMode(await detectOffice());

  const [{ createAuthClient }, { createTrpcClient }, { routeTree }] = await Promise.all([
    import("./utils/auth"),
    import("./utils/trpc"),
    import("./routeTree.gen"),
  ]);

  const authClient = createAuthClient();
  createTrpcClient();

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [getInitialEntry()] }),
    defaultPreload: "intent",
    scrollRestoration: false,
    defaultPendingComponent: () => <Loader />,
    context: { authClient },
  });

  const rootElement = document.getElementById("app");

  if (!rootElement) {
    throw new Error("Root element not found");
  }

  if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<RouterProvider router={router} />);
  }
}

void bootstrap();
