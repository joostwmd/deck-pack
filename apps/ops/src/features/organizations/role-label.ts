const ROLE_LABELS: Record<string, string> = {
  organizationOwner: "Owner",
  organizationAdmin: "Admin",
  organizationMember: "Member",
  organizationAddinUser: "Add-in user",
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function organizationRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
