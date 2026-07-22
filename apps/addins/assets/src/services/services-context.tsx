import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createAppServices } from "./app-services";
import type { AppServices } from "./types";

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({
  children,
  services,
}: {
  children: ReactNode;
  services?: AppServices;
}) {
  const value = useMemo(() => services ?? createAppServices(), [services]);

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error("useServices must be used within ServicesProvider");
  }
  return services;
}
