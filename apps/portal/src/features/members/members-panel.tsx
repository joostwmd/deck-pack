import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

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
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@deck-pack/ui/components/system/table";
import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";

import { Can } from "@/components/can";
import { PortalPageShell } from "@/components/portal-page-shell";
import { organizationRoleLabel } from "@/features/members/role-label";
import { trpc } from "@/utils/trpc";

const membersRoute = getRouteApi("/_protected/org/members");

const ASSIGNABLE_ROLES = [
  ORGANIZATION_ROLES.admin,
  ORGANIZATION_ROLES.member,
  ORGANIZATION_ROLES.addinUser,
  ORGANIZATION_ROLES.libraryManager,
] as const;

export function MembersPanel() {
  const { activeOrganizationId } = membersRoute.useRouteContext();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ASSIGNABLE_ROLES)[number]>(ORGANIZATION_ROLES.member);
  const [assignSeat, setAssignSeat] = useState(false);

  const membersQuery = useQuery(trpc.members.list.queryOptions());

  const addMutation = useMutation(
    trpc.members.add.mutationOptions({
      onSuccess: async () => {
        toast.success("Member added");
        setAddOpen(false);
        setEmail("");
        setAssignSeat(false);
        await queryClient.invalidateQueries({ queryKey: trpc.members.list.queryKey() });
        await queryClient.invalidateQueries({ queryKey: trpc.seats.list.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeMutation = useMutation(
    trpc.members.remove.mutationOptions({
      onSuccess: async () => {
        toast.success("Member removed");
        await queryClient.invalidateQueries({ queryKey: trpc.members.list.queryKey() });
        await queryClient.invalidateQueries({ queryKey: trpc.seats.list.queryKey() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const cancelInviteMutation = useMutation(
    trpc.members.cancelInvitation.mutationOptions({
      onSuccess: async () => {
        toast.success("Invitation canceled");
        await queryClient.invalidateQueries({ queryKey: trpc.members.list.queryKey() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (!activeOrganizationId) {
    return null;
  }

  const entries = membersQuery.data ?? [];

  return (
    <PortalPageShell
      title="Members"
      description="People who can access the organization portal."
      actions={
        <Can permissions={{ member: ["create"] }}>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={<Button type="button">Add member</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add member</DialogTitle>
                <DialogDescription>
                  Existing users are added immediately. New emails receive an invitation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="member-role">Role</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => {
                      if (
                        value === ORGANIZATION_ROLES.admin ||
                        value === ORGANIZATION_ROLES.member ||
                        value === ORGANIZATION_ROLES.addinUser ||
                        value === ORGANIZATION_ROLES.libraryManager
                      ) {
                        setRole(value);
                      }
                    }}
                  >
                    <SelectTrigger id="member-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {ASSIGNABLE_ROLES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {organizationRoleLabel(value)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assignSeat}
                    onChange={(e) => setAssignSeat(e.target.checked)}
                  />
                  Also assign an add-in seat
                </label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={addMutation.isPending || !email.trim()}
                  onClick={() =>
                    addMutation.mutate({ email: email.trim(), role, assignSeat })
                  }
                >
                  Add member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Can>
      }
    >
      {membersQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading members…</p>
      ) : membersQuery.isError ? (
        <p className="text-destructive text-sm">{membersQuery.error.message}</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                    No members yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={`${entry.kind}-${entry.id}`}>
                    <TableCell className="font-medium">{entry.name ?? "—"}</TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{organizationRoleLabel(entry.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "invited" ? "outline" : "default"}>
                        {entry.status === "invited" ? "Invited" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.kind === "invitation" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={cancelInviteMutation.isPending}
                          onClick={() =>
                            cancelInviteMutation.mutate({ invitationId: entry.id })
                          }
                        >
                          Cancel invite
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate({ memberId: entry.id })}
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </PortalPageShell>
  );
}
