export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean;
  createdAt: Date;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  organizationType: "individual" | "team" | null;
  memberRole: string | null;
};

export interface UsersStore {
  listUsers: () => Promise<PlatformUser[]>;
  deleteUser: (userId: string) => Promise<{ userId: string }>;
}

/** Duck-typed surface of `trpc.users`. */
export type UsersTrpcApi = {
  listUsers: { query: () => Promise<PlatformUser[]> };
  deleteUser: { mutate: (input: unknown) => Promise<{ userId: string }> };
};

export function createTrpcUsersStore(api: UsersTrpcApi): UsersStore {
  return {
    listUsers: () => api.listUsers.query(),
    deleteUser: (userId) => api.deleteUser.mutate({ userId }),
  };
}
