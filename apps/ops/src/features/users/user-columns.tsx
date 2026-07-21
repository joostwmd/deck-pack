import { Badge } from "@deck-pack/ui/components/system/badge";
import { Button } from "@deck-pack/ui/components/system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@deck-pack/ui/components/system/dialog";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowsClockwise, ArrowUp, Trash, UserSwitch } from "@phosphor-icons/react";
import { useState } from "react";

import type { PlatformUser } from "@/services/types";

export type UserColumnsOptions = {
  showImpersonate?: boolean;
  onImpersonate?: (user: PlatformUser) => void;
  impersonatingUserId?: string | null;
  showUpgradeToTeam?: boolean;
  onUpgradeToTeam?: (user: PlatformUser) => Promise<void>;
  upgradingUserId?: string | null;
  showDelete?: boolean;
  onDelete?: (user: PlatformUser) => Promise<void>;
  deletingUserId?: string | null;
  /** Hide delete for this user id (typically the signed-in admin). */
  currentUserId?: string | null;
};

function canUpgradeSoloOrg(user: PlatformUser): boolean {
  return (
    user.organizationType === "individual" &&
    Boolean(user.organizationId) &&
    Boolean(user.organizationSlug) &&
    Boolean(user.organizationName)
  );
}

function UpgradeToTeamButton({
  user,
  upgrading,
  onUpgrade,
}: {
  user: PlatformUser;
  upgrading: boolean;
  onUpgrade: (user: PlatformUser) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={upgrading}
            aria-label="Upgrade to team"
            title="Upgrade to team"
          >
            <ArrowUp className="size-3" />
            Upgrade
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to team workspace?</DialogTitle>
          <DialogDescription>
            This converts{" "}
            <span className="font-medium text-foreground">
              {user.organizationName ?? "this organization"}
            </span>{" "}
            from a solo workspace to a team organization for{" "}
            <span className="font-medium text-foreground">{user.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={upgrading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={upgrading}
            onClick={() => {
              void onUpgrade(user).then(() => setOpen(false));
            }}
          >
            {upgrading ? "Upgrading…" : "Upgrade to team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserButton({
  user,
  deleting,
  onDelete,
}: {
  user: PlatformUser;
  deleting: boolean;
  onDelete: (user: PlatformUser) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            disabled={deleting}
            aria-label={`Delete ${user.name}`}
            title="Delete"
          >
            <Trash className="size-3" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {user.name}?</DialogTitle>
          <DialogDescription>
            This permanently deletes{" "}
            <span className="font-medium text-foreground">{user.email}</span> and cascaded data
            (sessions, memberships, and related records). This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={() => {
              void onDelete(user).then(() => setOpen(false));
            }}
          >
            {deleting ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function createUserColumns(options: UserColumnsOptions = {}): ColumnDef<PlatformUser>[] {
  const columns: ColumnDef<PlatformUser>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "organizationName",
      header: "Organization",
      cell: ({ row }) => {
        const { organizationName, organizationType } = row.original;
        if (!organizationName) return "—";
        return (
          <div className="flex max-w-[18rem] items-center gap-1.5">
            <span className="truncate">{organizationName}</span>
            {organizationType ? (
              <Badge variant="secondary" className="shrink-0">
                {organizationType === "individual" ? "solo" : "team"}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        if (role === "admin") {
          return <Badge>Admin</Badge>;
        }
        return <Badge variant="secondary">User</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {row.original.createdAt.toLocaleDateString()}
        </span>
      ),
    },
  ];

  const showActions =
    (options.showImpersonate && options.onImpersonate) ||
    (options.showUpgradeToTeam && options.onUpgradeToTeam) ||
    (options.showDelete && options.onDelete);

  if (showActions) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const user = row.original;
        const pendingImpersonate = options.impersonatingUserId === user.id;
        const pendingDelete = options.deletingUserId === user.id;
        const pendingUpgrade = options.upgradingUserId === user.id;
        const canDelete =
          options.showDelete && options.onDelete && user.id !== options.currentUserId;
        const canUpgrade =
          options.showUpgradeToTeam && options.onUpgradeToTeam && canUpgradeSoloOrg(user);

        return (
          <div className="flex items-center justify-end gap-1">
            {options.showImpersonate && options.onImpersonate ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={pendingImpersonate || Boolean(options.impersonatingUserId)}
                onClick={() => options.onImpersonate?.(user)}
              >
                {pendingImpersonate ? (
                  <ArrowsClockwise className="size-3 animate-spin" />
                ) : (
                  <UserSwitch className="size-3" />
                )}
                Impersonate
              </Button>
            ) : null}
            {canUpgrade ? (
              <UpgradeToTeamButton
                user={user}
                upgrading={pendingUpgrade}
                onUpgrade={options.onUpgradeToTeam!}
              />
            ) : null}
            {canDelete ? (
              <DeleteUserButton user={user} deleting={pendingDelete} onDelete={options.onDelete!} />
            ) : null}
          </div>
        );
      },
    });
  }

  return columns;
}
