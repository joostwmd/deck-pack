import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import Loader from "@/components/loader";

interface OfficeContextValue {
  isReady: boolean;
  host: Office.HostType | null;
  platform: Office.PlatformType | null;
}

const OfficeContext = createContext<OfficeContextValue | null>(null);

export function OfficeProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [host, setHost] = useState<Office.HostType | null>(null);
  const [platform, setPlatform] = useState<Office.PlatformType | null>(null);

  useEffect(() => {
    const office = (window as Window & { Office?: typeof Office }).Office;

    if (!office) {
      // Plain browser — no Office host, treat as immediately ready.
      setIsReady(true);
      return;
    }

    office.onReady((info) => {
      setHost(info.host ?? null);
      setPlatform(info.platform ?? null);
      setIsReady(true);
    });
  }, []);

  if (!isReady) return <Loader />;

  return <OfficeContext.Provider value={{ isReady, host, platform }}>{children}</OfficeContext.Provider>;
}

export function useOffice() {
  const context = useContext(OfficeContext);

  if (!context) {
    throw new Error("useOffice must be used within OfficeProvider");
  }

  return context;
}
