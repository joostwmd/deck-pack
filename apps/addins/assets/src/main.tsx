import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { authClient } from "./utils/auth";

function getInitialEntry() {
  const path = window.location.pathname === "/index.html" ? "/" : window.location.pathname;
  return `${path}${window.location.search}${window.location.hash}`;
}

// Office add-in webviews block window.history.replaceState/pushState entirely.
// Seed memory history from the requested URL so /, /office/*, and /web/* remain distinct.
const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: [getInitialEntry()] }),
  defaultPreload: "intent",
  scrollRestoration: false,
  defaultPendingComponent: () => <Loader />,
  context: { authClient },
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
