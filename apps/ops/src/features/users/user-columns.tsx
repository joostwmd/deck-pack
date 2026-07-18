import { Badge } from "@deck-pack/ui/components/system/badge";
import { Button } from "@deck-pack/ui/components/system/button";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowsClockwise, UserSwitch } from "@phosphor-icons/react";

import type { PlatformUser } from "@/services/types";

export type UserColumnsOptions = {
  showImpersonate?: boolean;
  onImpersonate?: (user: PlatformUser) => void;
  impersonatingUserId?: string | null;
};

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

  if (options.showImpersonate && options.onImpersonate) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const user = row.original;
        const pending = options.impersonatingUserId === user.id;

        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || Boolean(options.impersonatingUserId)}
            onClick={() => options.onImpersonate?.(user)}
          >
            {pending ? (
              <ArrowsClockwise className="size-4 animate-spin" />
            ) : (
              <UserSwitch className="size-4" />
            )}
            Impersonate
          </Button>
        );
      },
    });
  }

  return columns;
}
