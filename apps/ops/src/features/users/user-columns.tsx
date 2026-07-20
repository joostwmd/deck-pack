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
import { ArrowsClockwise, Trash, UserSwitch } from "@phosphor-icons/react";
import { useState } from "react";

import type { PlatformUser } from "@/services/types";

export type UserColumnsOptions = {
  showImpersonate?: boolean;
  onImpersonate?: (user: PlatformUser) => void;
  impersonatingUserId?: string | null;
  showDelete?: boolean;
  onDelete?: (user: PlatformUser) => Promise<void>;
  deletingUserId?: string | null;
  /** Hide delete for this user id (typically the signed-in admin). */
  currentUserId?: string | null;
};

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
          <Button type="button" variant="destructive" size="sm" disabled={deleting}>
            <Trash className="size-4" />
            Delete
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
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
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
      cell: ({ row }) => row.original.organizationName ?? "—",
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
        <span className="text-muted-foreground">{row.original.createdAt.toLocaleString()}</span>
      ),
    },
  ];

  const showActions =
    (options.showImpersonate && options.onImpersonate) ||
    (options.showDelete && options.onDelete);

  if (showActions) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const user = row.original;
        const pendingImpersonate = options.impersonatingUserId === user.id;
        const pendingDelete = options.deletingUserId === user.id;
        const canDelete =
          options.showDelete &&
          options.onDelete &&
          user.id !== options.currentUserId;

        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {options.showImpersonate && options.onImpersonate ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pendingImpersonate || Boolean(options.impersonatingUserId)}
                onClick={() => options.onImpersonate?.(user)}
              >
                {pendingImpersonate ? (
                  <ArrowsClockwise className="size-4 animate-spin" />
                ) : (
                  <UserSwitch className="size-4" />
                )}
                Impersonate
              </Button>
            ) : null}
            {canDelete ? (
              <DeleteUserButton
                user={user}
                deleting={pendingDelete}
                onDelete={options.onDelete!}
              />
            ) : null}
          </div>
        );
      },
    });
  }

  return columns;
}
