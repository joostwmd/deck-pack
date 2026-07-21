import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { OpsPageShell } from "@/components/ops-page-shell";
import { createUserColumns } from "@/features/users/user-columns";
import { useServices } from "@/services/services-context";
import type { PlatformUser } from "@/services/types";

const PORTAL_URL = "http://localhost:3002";

function isAdminUser(user: PlatformUser): boolean {
  return user.role === "admin";
}

export function UsersPanel() {
  const queryClient = useQueryClient();
  const { users, auth, organization } = useServices();
  const { data: session } = auth.useSession();
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["users", "list"],
    queryFn: () => users.listUsers(),
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await auth.impersonateUser(userId);
      if (result.error) {
        throw new Error(result.error.message ?? "Could not impersonate user");
      }
      return result;
    },
    onMutate: (userId) => {
      setImpersonatingUserId(userId);
    },
    onSuccess: () => {
      toast.success("Now impersonating — opening portal");
      window.location.assign(PORTAL_URL);
    },
    onError: (error: Error) => {
      setImpersonatingUserId(null);
      toast.error(error.message || "Could not impersonate user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => users.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      toast.success("User deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete user");
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: (user: PlatformUser) => {
      if (
        !user.organizationId ||
        !user.organizationName ||
        !user.organizationSlug ||
        user.organizationType !== "individual"
      ) {
        throw new Error("User does not have a solo organization to upgrade");
      }

      return organization.updateOrganization({
        organizationId: user.organizationId,
        name: user.organizationName,
        slug: user.organizationSlug,
        type: "team",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
      toast.success("Solo workspace upgraded to team");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not upgrade organization");
    },
  });

  const handleImpersonate = useCallback(
    (user: PlatformUser) => {
      impersonateMutation.mutate(user.id);
    },
    [impersonateMutation],
  );

  const handleDelete = useCallback(
    async (user: PlatformUser) => {
      await deleteMutation.mutateAsync(user.id);
    },
    [deleteMutation],
  );

  const handleUpgradeToTeam = useCallback(
    async (user: PlatformUser) => {
      await upgradeMutation.mutateAsync(user);
    },
    [upgradeMutation],
  );

  const allUsers = listQuery.data ?? [];
  const adminUsers = useMemo(() => allUsers.filter(isAdminUser), [allUsers]);
  const customerUsers = useMemo(() => allUsers.filter((user) => !isAdminUser(user)), [allUsers]);

  const adminColumns = useMemo(
    () =>
      createUserColumns({
        showDelete: true,
        onDelete: handleDelete,
        deletingUserId: deleteMutation.isPending ? (deleteMutation.variables ?? null) : null,
        currentUserId: session?.user.id ?? null,
      }),
    [deleteMutation.isPending, deleteMutation.variables, handleDelete, session?.user.id],
  );

  const customerColumns = useMemo(
    () =>
      createUserColumns({
        showImpersonate: true,
        impersonatingUserId,
        onImpersonate: handleImpersonate,
        showUpgradeToTeam: true,
        onUpgradeToTeam: handleUpgradeToTeam,
        upgradingUserId: upgradeMutation.isPending ? (upgradeMutation.variables?.id ?? null) : null,
        showDelete: true,
        onDelete: handleDelete,
        deletingUserId: deleteMutation.isPending ? (deleteMutation.variables ?? null) : null,
        currentUserId: session?.user.id ?? null,
      }),
    [
      deleteMutation.isPending,
      deleteMutation.variables,
      handleDelete,
      handleImpersonate,
      handleUpgradeToTeam,
      impersonatingUserId,
      session?.user.id,
      upgradeMutation.isPending,
      upgradeMutation.variables,
    ],
  );

  return (
    <OpsPageShell
      title="Users"
      description="Platform admins and customer accounts. Search by email in each table."
    >
      {listQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading users…</p>
      ) : listQuery.isError ? (
        <p className="text-destructive text-sm">{listQuery.error.message}</p>
      ) : (
        <div className="space-y-10">
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Admins</h2>
              <p className="text-muted-foreground text-sm">
                Internal operators with platform admin access
              </p>
            </div>
            <DataTable
              columns={adminColumns}
              data={adminUsers}
              density="compact"
              filterColumnId="email"
              filterPlaceholder="Filter admins by email…"
              emptyMessage="No admin users found."
            />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Users</h2>
              <p className="text-muted-foreground text-sm">
                Customer accounts — impersonate to debug their portal experience
              </p>
            </div>
            <DataTable
              columns={customerColumns}
              data={customerUsers}
              density="compact"
              filterColumnId="email"
              filterPlaceholder="Filter users by email…"
              emptyMessage="No customer users found."
            />
          </section>
        </div>
      )}
    </OpsPageShell>
  );
}
