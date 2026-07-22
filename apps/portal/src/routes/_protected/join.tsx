import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { JoinConfirmCard } from "@/pages/join/join-confirm-card";
import { portalHomePath } from "@/config/portal-nav";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/_protected/join")({
  beforeLoad: async () => {
    const pending = await trpcClient.members.getPendingJoin.query();
    if (!pending) {
      throw redirect({ to: "/solo/home" });
    }
    if (pending.kind === "invitation" && pending.invitationId) {
      throw redirect({
        to: "/accept-invitation/$invitationId",
        params: { invitationId: pending.invitationId },
      });
    }
    return { pending };
  },
  component: JoinPendingSeatPage,
});

function AuthFlowShell({ children }: { children: ReactNode }) {
  return <div className="flex h-svh w-full items-center justify-center px-4 py-8">{children}</div>;
}

function JoinPendingSeatPage() {
  const navigate = useNavigate();
  const pendingQuery = useQuery(trpc.members.getPendingJoin.queryOptions());

  const acceptMutation = useMutation(
    trpc.members.acceptPendingSeat.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.vacatedAction === "deleted"
            ? "Previous workspace deleted. Seat activated."
            : result.vacatedAction === "left"
              ? "Left previous organization. Seat activated."
              : "Seat activated",
        );
        window.location.assign(portalHomePath(result.workspace));
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (pendingQuery.isLoading) {
    return (
      <AuthFlowShell>
        <div className="mx-auto w-full max-w-sm space-y-1.5 text-left">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Activate company seat
          </h1>
          <p className="text-xs text-muted-foreground">Loading…</p>
        </div>
      </AuthFlowShell>
    );
  }

  const pending = pendingQuery.data;
  if (!pending || pending.kind !== "seat") {
    return (
      <AuthFlowShell>
        <div className="mx-auto w-full max-w-sm space-y-1.5 text-left">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Activate company seat
          </h1>
          <p className="text-xs text-muted-foreground">No pending seat assignment.</p>
        </div>
      </AuthFlowShell>
    );
  }

  return (
    <AuthFlowShell>
      <JoinConfirmCard
        title="Activate company seat"
        description={`IT assigned you a seat in ${pending.organizationName}.`}
        targetOrganizationName={pending.organizationName}
        currentMembership={pending.currentMembership}
        confirming={acceptMutation.isPending}
        confirmLabel="Activate seat"
        onCancel={() =>
          void navigate({
            to: pending.currentMembership
              ? portalHomePath(
                  pending.currentMembership.organizationType === "team" ? "team" : "solo",
                )
              : "/solo/account",
          })
        }
        onConfirm={() => {
          acceptMutation.mutate({
            confirmReplace: Boolean(pending.currentMembership),
          });
        }}
      />
    </AuthFlowShell>
  );
}
