export type OrganizationType = "individual" | "team";

export type MemberListEntry = {
  kind: "member" | "invitation";
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: "active" | "invited";
  createdAt: Date;
};

export type MembershipImpact = {
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType | null;
  willDeleteOnVacate: boolean;
  blockedSoleOwner: boolean;
};

export type OrganizationMemberRow = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type PendingInvitationRow = {
  invitationId: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
};

export type InvitationDetails = {
  invitationId: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType | null;
};

export type CurrentMembershipSummary = {
  memberId: string;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType | null;
  role: string;
  memberCount: number;
  willDeleteOnVacate: boolean;
  blockedSoleOwner: boolean;
};

export type PendingOrgIntent =
  | {
      kind: "invitation";
      invitationId: string;
      organizationId: string;
      organizationName: string;
      role: string | null;
    }
  | {
      kind: "seat";
      seatId: string;
      organizationId: string;
      organizationName: string;
    };

export type UserByEmail = {
  id: string;
  name: string;
  email: string;
  hasOrg: boolean;
};

export type AddMemberInput = {
  organizationId: string;
  email: string;
  role: string;
  assignSeat: boolean;
  inviterId: string;
  headers: Headers;
};

export type AddMemberResult =
  | { kind: "member"; memberId: string }
  | { kind: "invitation"; invitationId: string };

export type JoinResult = {
  organizationId: string;
  workspace: "solo" | "team" | null;
  vacatedAction: "deleted" | "left" | null;
};

export type PendingJoin = {
  kind: "invitation" | "seat";
  invitationId?: string;
  seatId?: string;
  organizationId: string;
  organizationName: string;
  role: string | null;
  currentMembership: MembershipImpact | null;
};

export type InvitationPreview = {
  invitationId: string;
  email: string;
  role: string | null;
  expiresAt: Date;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType | null;
  status: string;
  currentMembership: MembershipImpact | null;
};

export type OrganizationProfile = {
  type: OrganizationType | null;
  workspace: "solo" | "team" | null;
  plan: { id: string; name: string; slug: string; quantity: number } | null;
};

export type UpdateMemberRoleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "cannot_demote_last_owner" | "invalid_role" };

export type RemoveMemberResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "cannot_remove_last_owner" };

export type CancelInvitationResult = { ok: true } | { ok: false; reason: "not_found" };

export type AddOrganizationMemberResult =
  | { ok: true; memberId: string }
  | { ok: false; reason: "already_member" | "user_in_other_org" };

export type AssignSeatResult =
  | {
      ok: true;
      seatId: string;
      status: string;
      email: string;
      userId: string | null;
      assignedAt: Date;
      activatedAt: Date | null;
    }
  | {
      ok: false;
      reason: "no_subscription" | "at_capacity" | "email_already_assigned" | "user_in_other_org";
    };

export type VacateResult =
  | { ok: true; action: "deleted" | "left"; organizationId: string }
  | { ok: false; reason: "no_membership" | "sole_owner_with_other_members" };

export type AcceptInvitationForUserResult =
  | { ok: true; organizationId: string; memberId: string; role: string }
  | {
      ok: false;
      reason:
        | "not_found"
        | "not_pending"
        | "expired"
        | "email_mismatch"
        | "user_not_found"
        | "already_member"
        | "user_in_other_org";
    };

export type ActivateSeatResult =
  | { ok: true; organizationId: string; activated: boolean }
  | { ok: false; reason: "user_in_other_org" | "no_pending_seat" };
