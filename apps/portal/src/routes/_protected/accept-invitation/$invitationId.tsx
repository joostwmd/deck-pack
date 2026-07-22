import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { JoinConfirmCard } from "@/pages/join/join-confirm-card";
import { portalHomePath } from "@/config/portal-nav";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_protected/accept-invitation/$invitationId")({
  component: AcceptInvitationPage,
});

function AuthFlowShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh w-full items-center justify-center px-4 py-8">{children}</div>
  );
}

function AcceptInvitationPage() {
  const { invitationId } = Route.useParams();
  const navigate = useNavigate();

  const previewQuery = useQuery(
    trpc.members.getInvitationPreview.queryOptions({ invitationId }),
  );

  const acceptMutation = useMutation(
    trpc.members.acceptInvitation.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.vacatedAction === "deleted"
            ? "Previous workspace deleted. Welcome to your new organization."
            : result.vacatedAction === "left"
              ? "Left previous organization. Welcome."
              : "Joined organization",
        );
        // Full reload so session activeOrganizationId / workspace refresh everywhere.
        window.location.assign(portalHomePath(result.workspace));
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (previewQuery.isLoading) {
    return (
      <AuthFlowShell>
        <div className="mx-auto w-full max-w-sm space-y-1.5 text-left">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Accept invitation
          </h1>
          <p className="text-xs text-muted-foreground">Loading invitation…</p>
        </div>
      </AuthFlowShell>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <AuthFlowShell>
        <div className="mx-auto w-full max-w-sm space-y-4 text-left">
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Accept invitation
            </h1>
            <p className="text-xs text-muted-foreground">
              This invitation could not be loaded.
            </p>
          </div>
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {previewQuery.error?.message ?? "Invitation not found"}
          </div>
        </div>
      </AuthFlowShell>
    );
  }

  const preview = previewQuery.data;
  const expired =
    (preview.expiresAt instanceof Date
      ? preview.expiresAt
      : new Date(preview.expiresAt)
    ).getTime() <= Date.now();
  const notPending = preview.status !== "pending";

  if (expired || notPending) {
    return (
      <AuthFlowShell>
        <div className="mx-auto w-full max-w-sm space-y-1.5 text-left">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Accept invitation
          </h1>
          <p className="text-xs text-muted-foreground">
            {expired
              ? "This invitation has expired."
              : "This invitation is no longer pending."}
          </p>
        </div>
      </AuthFlowShell>
    );
  }

  return (
    <AuthFlowShell>
      <JoinConfirmCard
        title="Accept invitation"
        description={`You've been invited to join ${preview.organizationName}.`}
        targetOrganizationName={preview.organizationName}
        currentMembership={preview.currentMembership}
        confirming={acceptMutation.isPending}
        onCancel={() =>
          void navigate({
            to: preview.currentMembership
              ? portalHomePath(
                  preview.currentMembership.organizationType === "team" ? "team" : "solo",
                )
              : "/solo/account",
          })
        }
        onConfirm={() => {
          acceptMutation.mutate({
            invitationId,
            confirmReplace: Boolean(preview.currentMembership),
          });
        }}
      />
    </AuthFlowShell>
  );
}
