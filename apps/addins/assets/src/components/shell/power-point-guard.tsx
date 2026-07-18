import { isPowerPointApiAvailable } from "@deck-pack/office-js";
import type { ReactNode } from "react";

import { PowerPointRequiredNoticeView } from "@/components/shell/powerpoint-required-notice-view";
import { useEnvironment } from "@/contexts/EnvironmentContext";

type PowerPointApiLevel = Parameters<typeof isPowerPointApiAvailable>[0];

export type { PowerPointApiLevel };

export type PowerPointGuardProps = {
  powerpointRequired?: boolean;
  minApi?: PowerPointApiLevel;
  children: ReactNode;
};

export function PowerPointGuard({
  powerpointRequired = false,
  minApi,
  children,
}: PowerPointGuardProps) {
  const { isOfficeAvailable } = useEnvironment();

  if (powerpointRequired && !isOfficeAvailable) {
    return <PowerPointRequiredNoticeView kind="host" />;
  }

  if (minApi && isOfficeAvailable && !isPowerPointApiAvailable(minApi)) {
    return <PowerPointRequiredNoticeView kind="api" minApi={minApi} />;
  }

  return children;
}
