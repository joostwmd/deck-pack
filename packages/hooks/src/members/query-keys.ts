export const membersKeys = {
  list: () => ["members", "list"] as const,
  pendingJoin: () => ["members", "pendingJoin"] as const,
  invitationPreview: (invitationId: string) =>
    ["members", "invitationPreview", invitationId] as const,
};
