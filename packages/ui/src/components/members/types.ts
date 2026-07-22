export type MemberListEntry = {
  kind: "member" | "invitation";
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: "active" | "invited";
  createdAt: Date;
};

export type AssignableRoleOption = {
  value: string;
  label: string;
};
