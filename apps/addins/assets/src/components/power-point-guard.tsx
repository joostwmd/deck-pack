import { isPowerPointApiAvailable } from "@deck-pack/office-js";
import { WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { useEnvironment } from "@/contexts/EnvironmentContext";

type PowerPointApiLevel = Parameters<typeof isPowerPointApiAvailable>[0];

type GuardFailure =
  | { kind: "host"; variant: "block" }
  | { kind: "api"; variant: "inline"; minApi: PowerPointApiLevel };

export type PowerPointGuardProps = {
  powerpointRequired?: boolean;
  minApi?: PowerPointApiLevel;
  children: ReactNode;
};

function evaluateGuardFailure(
  powerpointRequired: boolean,
  minApi: PowerPointApiLevel | undefined,
  isOfficeAvailable: boolean,
): GuardFailure | null {
  if (powerpointRequired && !isOfficeAvailable) {
    return { kind: "host", variant: "block" };
  }

  if (minApi && isOfficeAvailable && !isPowerPointApiAvailable(minApi)) {
    return { kind: "api", variant: "inline", minApi };
  }

  return null;
}

function GuardBlockedMessage({ failure }: { failure: GuardFailure }) {
  if (failure.kind === "host") {
    return (
      <EmptyState
        icon={WarningCircle}
        title="Office required"
        description="Open this add-in inside PowerPoint to use this feature."
      />
    );
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
    >
      <WarningCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        This feature requires PowerPoint API {failure.minApi} or later. Update PowerPoint to a
        newer build to enable it.
      </p>
    </div>
  );
}

export function PowerPointGuard({
  powerpointRequired = false,
  minApi,
  children,
}: PowerPointGuardProps) {
  const { isOfficeAvailable } = useEnvironment();
  const failure = evaluateGuardFailure(powerpointRequired, minApi, isOfficeAvailable);

  if (failure) {
    return <GuardBlockedMessage failure={failure} />;
  }

  return children;
}
