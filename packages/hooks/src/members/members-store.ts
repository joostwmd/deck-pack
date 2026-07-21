export type MemberListEntry = {
  kind: "member" | "invitation";
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: "active" | "invited";
  createdAt: Date;
};

export type CurrentMembershipImpact = {
  organizationId: string;
  organizationName: string;
  organizationType: "individual" | "team" | null;
  willDeleteOnVacate: boolean;
  blockedSoleOwner: boolean;
} | null;

export type InvitationPreview = {
  invitationId: string;
  email: string;
  role: string | null;
  expiresAt: Date;
  organizationId: string;
  organizationName: string;
  organizationType: "individual" | "team" | null;
  status: string;
  currentMembership: CurrentMembershipImpact;
};

export type PendingJoin = {
  kind: "invitation" | "seat";
  invitationId?: string;
  seatId?: string;
  organizationId: string;
  organizationName: string;
  role?: string | null;
  currentMembership: CurrentMembershipImpact;
} | null;

export type JoinResult = {
  organizationId: string;
  workspace: "solo" | "team" | null;
  vacatedAction: "deleted" | "left" | null;
};

export type AddMemberInput = {
  email: string;
  role: string;
  assignSeat: boolean;
};

export type AddMemberResult =
  | { kind: "member"; memberId: string }
  | { kind: "invitation"; invitationId: string };

export interface MembersStore {
  list: () => Promise<MemberListEntry[]>;
  add: (input: AddMemberInput) => Promise<AddMemberResult>;
  updateRole: (input: { memberId: string; role: string }) => Promise<{ memberId: string }>;
  remove: (input: { memberId: string }) => Promise<{ memberId: string }>;
  cancelInvitation: (input: { invitationId: string }) => Promise<{ invitationId: string }>;
  getPendingJoin: () => Promise<PendingJoin>;
  acceptPendingSeat: (input: { confirmReplace: boolean }) => Promise<JoinResult>;
  getInvitationPreview: (input: { invitationId: string }) => Promise<InvitationPreview>;
  acceptInvitation: (input: {
    invitationId: string;
    confirmReplace: boolean;
  }) => Promise<JoinResult>;
}

/** Duck-typed surface of `trpc.members`. */
export type MembersTrpcApi = {
  list: { query: () => Promise<MemberListEntry[]> };
  add: { mutate: (input: unknown) => Promise<AddMemberResult> };
  updateRole: { mutate: (input: unknown) => Promise<{ memberId: string }> };
  remove: { mutate: (input: unknown) => Promise<{ memberId: string }> };
  cancelInvitation: { mutate: (input: unknown) => Promise<{ invitationId: string }> };
  getPendingJoin: { query: () => Promise<PendingJoin> };
  acceptPendingSeat: { mutate: (input: unknown) => Promise<JoinResult> };
  getInvitationPreview: { query: (input: unknown) => Promise<InvitationPreview> };
  acceptInvitation: { mutate: (input: unknown) => Promise<JoinResult> };
};

export function createTrpcMembersStore(api: MembersTrpcApi): MembersStore {
  return {
    list: () => api.list.query(),
    add: (input) => api.add.mutate(input),
    updateRole: (input) => api.updateRole.mutate(input),
    remove: (input) => api.remove.mutate(input),
    cancelInvitation: (input) => api.cancelInvitation.mutate(input),
    getPendingJoin: () => api.getPendingJoin.query(),
    acceptPendingSeat: (input) => api.acceptPendingSeat.mutate(input),
    getInvitationPreview: (input) => api.getInvitationPreview.query(input),
    acceptInvitation: (input) => api.acceptInvitation.mutate(input),
  };
}
