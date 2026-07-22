export const brandProfileKeys = {
  all: ["brand-profiles"] as const,
  list: () => [...brandProfileKeys.all, "list"] as const,
  detail: (profileId: string, versionId?: string) =>
    [...brandProfileKeys.all, "detail", profileId, versionId ?? "active"] as const,
};
