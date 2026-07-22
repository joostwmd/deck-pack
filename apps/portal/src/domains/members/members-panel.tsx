import { getRouteApi } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useAddMember,
  useCancelInvitation,
  useMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "@deck-pack/hooks/members";
import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";
import { Button } from "@deck-pack/ui/components/system/button";
import {
  AddMemberDialogView,
  ChangeRoleDialogView,
  MembersView,
} from "@deck-pack/ui/components/members/members-view";
import { organizationRoleLabel } from "@deck-pack/ui/lib/organization-role-label";

import { useCan } from "@/auth/use-can";
import { Can } from "@/components/can";
import { PortalPageShell } from "@/components/portal-page-shell";
import { useServices } from "@/services/services-context";

const membersRoute = getRouteApi("/_protected/org/members");

const ASSIGNABLE_ROLES = [
  ORGANIZATION_ROLES.admin,
  ORGANIZATION_ROLES.member,
  ORGANIZATION_ROLES.addinUser,
  ORGANIZATION_ROLES.libraryManager,
] as const;

function invitationAcceptUrl(invitationId: string) {
  return `${window.location.origin}/accept-invitation/${invitationId}`;
}

async function copyInvitationLink(invitationId: string) {
  const url = invitationAcceptUrl(invitationId);
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  } catch {
    toast.message("Invite link", { description: url });
  }
}

function isAssignableRole(value: string): value is (typeof ASSIGNABLE_ROLES)[number] {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

export function MembersPanel() {
  const { activeOrganizationId } = membersRoute.useRouteContext();
  const { members } = useServices();
  const { can } = useCan();
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ASSIGNABLE_ROLES)[number]>(ORGANIZATION_ROLES.member);
  const [assignSeat, setAssignSeat] = useState(false);
  const [roleEdit, setRoleEdit] = useState<{
    memberId: string;
    name: string | null;
    email: string;
    role: (typeof ASSIGNABLE_ROLES)[number];
  } | null>(null);

  const assignableRoles = useMemo(
    () =>
      ASSIGNABLE_ROLES.map((value) => ({
        value,
        label: organizationRoleLabel(value),
      })),
    [],
  );

  const membersQuery = useMembers(members);

  const addMutation = useAddMember(members);
  const updateRoleMutation = useUpdateMemberRole(members);
  const removeMutation = useRemoveMember(members);
  const cancelInviteMutation = useCancelInvitation(members);

  const handleAdd = () => {
    addMutation.mutate(
      { email: email.trim(), role, assignSeat },
      {
        onSuccess: async (result) => {
          if (result.kind === "invitation") {
            toast.success("Invitation emailed");
            await copyInvitationLink(result.invitationId);
          } else {
            toast.success("Member added");
          }
          setAddOpen(false);
          setEmail("");
          setAssignSeat(false);
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

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
          <AddMemberDialogView
            open={addOpen}
            onOpenChange={setAddOpen}
            email={email}
            onEmailChange={setEmail}
            role={role}
            onRoleChange={(value) => {
              if (isAssignableRole(value)) {
                setRole(value);
              }
            }}
            assignSeat={assignSeat}
            onAssignSeatChange={setAssignSeat}
            assignableRoles={assignableRoles}
            onSubmit={handleAdd}
            isPending={addMutation.isPending}
            trigger={<Button type="button">Add member</Button>}
          />
        </Can>
      }
    >
      <MembersView
        loading={membersQuery.isLoading}
        errorMessage={membersQuery.isError ? membersQuery.error.message : undefined}
        entries={entries}
        cancelInvitationPending={cancelInviteMutation.isPending}
        removeMemberPending={removeMutation.isPending}
        canUpdateMember={can({ member: ["update"] })}
        canDeleteMember={can({ member: ["delete"] })}
        onCopyInvitationLink={(invitationId) => void copyInvitationLink(invitationId)}
        onCancelInvitation={(invitationId) =>
          cancelInviteMutation.mutate(
            { invitationId },
            {
              onSuccess: () => toast.success("Invitation canceled"),
              onError: (error: Error) => toast.error(error.message),
            },
          )
        }
        onChangeRole={(entry) =>
          setRoleEdit({
            memberId: entry.id,
            name: entry.name,
            email: entry.email,
            role: isAssignableRole(entry.role) ? entry.role : ORGANIZATION_ROLES.admin,
          })
        }
        onRemoveMember={(memberId) =>
          removeMutation.mutate(
            { memberId },
            {
              onSuccess: () => toast.success("Member removed"),
              onError: (error: Error) => toast.error(error.message),
            },
          )
        }
      />

      <ChangeRoleDialogView
        open={roleEdit !== null}
        onOpenChange={(open) => {
          if (!open) setRoleEdit(null);
        }}
        memberName={roleEdit?.name ?? null}
        memberEmail={roleEdit?.email ?? ""}
        role={roleEdit?.role ?? ORGANIZATION_ROLES.member}
        onRoleChange={(value) => {
          if (!roleEdit || !isAssignableRole(value)) return;
          setRoleEdit({ ...roleEdit, role: value });
        }}
        assignableRoles={assignableRoles}
        onCancel={() => setRoleEdit(null)}
        isPending={updateRoleMutation.isPending}
        onSubmit={() => {
          if (!roleEdit) return;
          updateRoleMutation.mutate(
            { memberId: roleEdit.memberId, role: roleEdit.role },
            {
              onSuccess: () => {
                toast.success("Role updated");
                setRoleEdit(null);
              },
              onError: (error: Error) => toast.error(error.message),
            },
          );
        }}
      />
    </PortalPageShell>
  );
}
