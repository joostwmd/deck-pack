export const organizationKeys = {
  all: () => ["organization"] as const,
  list: () => ["organization", "list"] as const,
  detail: (organizationId: string) => ["organization", "detail", organizationId] as const,
  members: (organizationId: string) => ["organization", "members", organizationId] as const,
  lookupUser: (email: string | null) => ["organization", "lookupUser", email] as const,
};
