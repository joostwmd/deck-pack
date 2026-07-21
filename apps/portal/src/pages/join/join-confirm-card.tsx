import { Badge } from "@deck-pack/ui/components/system/badge";
import { Button } from "@deck-pack/ui/components/system/button";
import { Label } from "@deck-pack/ui/components/system/label";
import { cn } from "@deck-pack/ui/lib/utils";
import { SpinnerIcon } from "@phosphor-icons/react";

export type CurrentMembershipImpact = {
  organizationId: string;
  organizationName: string;
  organizationType: "individual" | "team" | null;
  willDeleteOnVacate: boolean;
  blockedSoleOwner: boolean;
} | null;

export type JoinConfirmCardProps = {
  title: string;
  description: string;
  targetOrganizationName: string;
  currentMembership: CurrentMembershipImpact;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  className?: string;
};

export function JoinConfirmCard({
  title,
  description,
  targetOrganizationName,
  currentMembership,
  confirming,
  onConfirm,
  onCancel,
  confirmLabel = "Join organization",
  className,
}: JoinConfirmCardProps) {
  const blocked = Boolean(currentMembership?.blockedSoleOwner);
  const needsReplace = Boolean(currentMembership && !blocked);

  const primaryLabel = confirming
    ? "Joining…"
    : needsReplace
      ? currentMembership?.willDeleteOnVacate
        ? "Delete workspace and join"
        : "Leave and join"
      : confirmLabel;

  return (
    <div className={cn("mx-auto w-full max-w-sm space-y-6", className)}>
      <div className="space-y-1.5 text-left">
        <h1 className="text-balance text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-balance text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Organization</Label>
          <div className="flex min-h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground">
            {targetOrganizationName}
          </div>
        </div>

        {needsReplace ? (
          <div
            role="alert"
            className="space-y-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
          >
            <p className="font-medium text-destructive">One organization at a time</p>
            {currentMembership?.willDeleteOnVacate ? (
              <p className="text-xs text-muted-foreground">
                Joining will permanently delete{" "}
                <span className="font-medium text-foreground">
                  {currentMembership.organizationName}
                </span>
                {currentMembership.organizationType === "individual" ? (
                  <Badge variant="secondary" className="ml-1 align-middle">
                    solo
                  </Badge>
                ) : null}{" "}
                and its data.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Joining will remove you from{" "}
                <span className="font-medium text-foreground">
                  {currentMembership?.organizationName}
                </span>
                .
              </p>
            )}
          </div>
        ) : null}

        {blocked ? (
          <div
            role="alert"
            className="space-y-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
          >
            <p className="font-medium text-destructive">Cannot leave current organization</p>
            <p className="text-xs text-muted-foreground">
              You are the sole owner of{" "}
              <span className="font-medium text-foreground">
                {currentMembership?.organizationName}
              </span>{" "}
              which still has other members. Transfer ownership before joining another organization.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={confirming || blocked}
            variant={needsReplace ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirming ? (
              <SpinnerIcon className="animate-spin motion-reduce:animate-none" />
            ) : null}
            {primaryLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onCancel}
            disabled={confirming}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
