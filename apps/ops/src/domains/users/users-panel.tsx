import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { env } from "@deck-pack/env/web";
import { organizationKeys } from "@deck-pack/hooks/organization";
import { useDeleteUser, usersKeys, useUsers } from "@deck-pack/hooks/users";
import { createUserColumns } from "@deck-pack/ui/components/users/user-columns";
import type { PlatformUser } from "@deck-pack/ui/components/users/types";

import { DataTable } from "@/components/data-table";
import { OpsPageShell } from "@/components/ops-page-shell";
import { useServices } from "@/services/services-context";

function isAdminUser(user: PlatformUser): boolean {
  return user.role === "admin";
}

export function UsersPanel() {
  const queryClient = useQueryClient();
  const { users, auth, organization } = useServices();
  const { data: session } = auth.useSession();
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);

  const listQuery = useUsers(users);

  const impersonateUser = useCallback(
    async (userId: string) => {
      setImpersonatingUserId(userId);
      try {
        const result = await auth.impersonateUser(userId);
        if (result.error) {
          throw new Error(result.error.message ?? "Could not impersonate user");
        }
        toast.success("Now impersonating — opening portal");
        window.location.assign(env.VITE_PORTAL_URL);
      } catch (error) {
        setImpersonatingUserId(null);
        toast.error(error instanceof Error ? error.message : "Could not impersonate user");
      }
    },
    [auth],
  );

  const deleteMutation = useDeleteUser(users);

  const [upgradingUserId, setUpgradingUserId] = useState<string | null>(null);

  const upgradeUser = useCallback(
    async (user: PlatformUser) => {
      if (
        !user.organizationId ||
        !user.organizationName ||
        !user.organizationSlug ||
        user.organizationType !== "individual"
      ) {
        toast.error("User does not have a solo organization to upgrade");
        return;
      }

      setUpgradingUserId(user.id);
      try {
        await organization.updateOrganization({
          organizationId: user.organizationId,
          name: user.organizationName,
          slug: user.organizationSlug,
          type: "team",
        });
        void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
        void queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
        toast.success("Solo workspace upgraded to team");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not upgrade organization");
      } finally {
        setUpgradingUserId(null);
      }
    },
    [organization, queryClient],
  );

  const handleDelete = useCallback(
    async (user: PlatformUser) => {
      await deleteMutation.mutateAsync(user.id, {
        onSuccess: () => toast.success("User deleted"),
        onError: (error: Error) => toast.error(error.message || "Could not delete user"),
      });
    },
    [deleteMutation],
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
        onImpersonate: (user) => void impersonateUser(user.id),
        showUpgradeToTeam: true,
        onUpgradeToTeam: upgradeUser,
        upgradingUserId,
        showDelete: true,
        onDelete: handleDelete,
        deletingUserId: deleteMutation.isPending ? (deleteMutation.variables ?? null) : null,
        currentUserId: session?.user.id ?? null,
      }),
    [
      deleteMutation.isPending,
      deleteMutation.variables,
      handleDelete,
      impersonateUser,
      impersonatingUserId,
      session?.user.id,
      upgradeUser,
      upgradingUserId,
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
