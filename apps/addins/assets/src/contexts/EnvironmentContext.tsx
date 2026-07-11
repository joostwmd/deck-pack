import { isOfficeDocumentAvailable } from "@deck-pack/office-js";
import { createContext, useContext, type ReactNode } from "react";

export type EnvironmentType = "office" | "web";

interface EnvironmentContextValue {
  environment: EnvironmentType;
  isOfficeAvailable: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  // By the time this mounts, OfficeProvider has already awaited Office.onReady,
  // so isOfficeDocumentAvailable() is a reliable synchronous check.
  const isOfficeAvailable = isOfficeDocumentAvailable();
  const environment: EnvironmentType = isOfficeAvailable ? "office" : "web";

  return (
    <EnvironmentContext.Provider value={{ environment, isOfficeAvailable }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);

  if (!context) {
    throw new Error("useEnvironment must be used within EnvironmentProvider");
  }

  return context;
}
