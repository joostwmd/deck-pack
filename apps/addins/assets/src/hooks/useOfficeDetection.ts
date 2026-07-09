import { useEnvironment } from "@/contexts/EnvironmentContext";

export function useOfficeDetection() {
  const { environment, isOfficeAvailable } = useEnvironment();

  return {
    environment,
    isOfficeAvailable,
    isLoading: environment === "loading",
    isWeb: environment === "web",
  };
}
