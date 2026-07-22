import type { ReactElement } from "react";

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
import { organizationRoleLabel } from "@deck-pack/ui/lib/organization-role-label";

import type { AssignableRoleOption, MemberListEntry } from "./types";

export type MembersViewProps = {
  loading: boolean;
  errorMessage?: string;
  entries: MemberListEntry[];
  cancelInvitationPending: boolean;
  removeMemberPending: boolean;
  canUpdateMember: boolean;
  canDeleteMember: boolean;
  onCopyInvitationLink: (invitationId: string) => void;
  onCancelInvitation: (invitationId: string) => void;
  onChangeRole: (entry: MemberListEntry) => void;
  onRemoveMember: (memberId: string) => void;
};

export function MembersView({
  loading,
  errorMessage,
  entries,
  cancelInvitationPending,
  removeMemberPending,
  canUpdateMember,
  canDeleteMember,
  onCopyInvitationLink,
  onCancelInvitation,
  onChangeRole,
  onRemoveMember,
}: MembersViewProps) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading members…</p>;
  }

  if (errorMessage) {
    return <p className="text-destructive text-sm">{errorMessage}</p>;
  }

  return (
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
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onCopyInvitationLink(entry.id)}
                      >
                        Copy link
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={cancelInvitationPending}
                        onClick={() => onCancelInvitation(entry.id)}
                      >
                        Cancel invite
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      {canUpdateMember ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onChangeRole(entry)}
                        >
                          Change role
                        </Button>
                      ) : null}
                      {canDeleteMember ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={removeMemberPending}
                          onClick={() => onRemoveMember(entry.id)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export type AddMemberDialogViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onEmailChange: (email: string) => void;
  role: string;
  onRoleChange: (role: string) => void;
  assignSeat: boolean;
  onAssignSeatChange: (assignSeat: boolean) => void;
  assignableRoles: AssignableRoleOption[];
  onSubmit: () => void;
  isPending: boolean;
  trigger: ReactElement;
};

export function AddMemberDialogView({
  open,
  onOpenChange,
  email,
  onEmailChange,
  role,
  onRoleChange,
  assignSeat,
  onAssignSeatChange,
  assignableRoles,
  onSubmit,
  isPending,
  trigger,
}: AddMemberDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>
            Existing users are added immediately. New emails receive an invitation link you can copy
            and share.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-role">Role</Label>
            <Select value={role} onValueChange={(value) => value != null && onRoleChange(value)}>
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {assignableRoles.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
              onChange={(e) => onAssignSeatChange(e.target.checked)}
            />
            Also assign an add-in seat
          </label>
        </div>
        <DialogFooter>
          <Button type="button" disabled={isPending || !email.trim()} onClick={onSubmit}>
            Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ChangeRoleDialogViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string | null;
  memberEmail: string;
  role: string;
  onRoleChange: (role: string) => void;
  assignableRoles: AssignableRoleOption[];
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
};

export function ChangeRoleDialogView({
  open,
  onOpenChange,
  memberName,
  memberEmail,
  role,
  onRoleChange,
  assignableRoles,
  onSubmit,
  onCancel,
  isPending,
}: ChangeRoleDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the portal role for {memberName?.trim() || memberEmail || "this member"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="edit-member-role">Role</Label>
          <Select value={role} onValueChange={(value) => value != null && onRoleChange(value)}>
            <SelectTrigger id="edit-member-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {assignableRoles.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending} onClick={onSubmit}>
            {isPending ? "Saving…" : "Save role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
