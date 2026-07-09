import { detectOffice } from "@deck-pack/office-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type EnvironmentType = "loading" | "office" | "web";

interface EnvironmentContextValue {
  environment: EnvironmentType;
  isOfficeAvailable: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = useState<EnvironmentType>("loading");

  useEffect(() => {
    let mounted = true;

    detectOffice().then((available) => {
      if (mounted) {
        setEnvironment(available ? "office" : "web");
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const value: EnvironmentContextValue = {
    environment,
    isOfficeAvailable: environment === "office",
  };

  return (
    <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);

  if (!context) {
    throw new Error("useEnvironment must be used within EnvironmentProvider");
  }

  return context;
}
