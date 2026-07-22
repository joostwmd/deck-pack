import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createAppServices } from "./app-services";
import type { OpsAppServices } from "./types";

const ServicesContext = createContext<OpsAppServices | null>(null);

export function ServicesProvider({
  children,
  services,
}: {
  children: ReactNode;
  services?: OpsAppServices;
}) {
  const value = useMemo(() => services ?? createAppServices(), [services]);

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): OpsAppServices {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error("useServices must be used within ServicesProvider");
  }
  return services;
}
