import { createAccessControl } from "better-auth/plugins/access";

// ─── CUSTOM RBAC DEFINITION ─────────────────────────────
const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  project: ["create", "read", "update", "delete"],
  task: ["create", "read", "update", "delete", "assign"],
  billing: ["view", "manage"],
};

export const ac = createAccessControl(statement);

export const organizationOwner = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  project: ["create", "read", "update", "delete"],
  task: ["create", "read", "update", "delete", "assign"],
  billing: ["view", "manage"],
});

export const organizationAdmin = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  project: ["create", "read", "update"],
  task: ["create", "read", "update", "assign"],
  billing: ["view"],
});

export const organizationMember = ac.newRole({
  project: ["read", "create"],
  task: ["read", "create", "update"],
});
