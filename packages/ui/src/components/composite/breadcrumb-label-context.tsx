import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BreadcrumbLabelContextValue = {
  labels: Record<string, string | undefined>;
  setLabel: (key: string, label: string | undefined) => void;
};

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue | null>(null);

export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string | undefined>>({});

  const setLabel = useCallback((key: string, label: string | undefined) => {
    setLabels((prev) => {
      if (prev[key] === label) {
        return prev;
      }
      return { ...prev, [key]: label };
    });
  }, []);

  const value = useMemo(() => ({ labels, setLabel }), [labels, setLabel]);

  return (
    <BreadcrumbLabelContext.Provider value={value}>{children}</BreadcrumbLabelContext.Provider>
  );
}

export function useBreadcrumbLabels(): Record<string, string | undefined> {
  const ctx = useContext(BreadcrumbLabelContext);
  return ctx?.labels ?? {};
}

/** Sets a dynamic breadcrumb label for the current page; clears on unmount. */
export function useBreadcrumbLabel(key: string, label: string | undefined) {
  const setLabel = useContext(BreadcrumbLabelContext)?.setLabel;

  useEffect(() => {
    if (!setLabel) {
      return;
    }
    setLabel(key, label);
    return () => {
      setLabel(key, undefined);
    };
  }, [setLabel, key, label]);
}
