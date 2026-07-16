const mockSession = {
  user: {
    id: "story-user-id",
    name: "Story User",
    email: "story@example.com",
    role: "user" as const,
  },
};

export function createAuthClient() {
  return {
    getSession: async () => ({ data: mockSession, error: null }),
    useSession: () => ({ data: mockSession, isPending: false, error: null }),
    signOut: async () => ({ data: null, error: null }),
  };
}

export function getAuthClient() {
  return createAuthClient();
}

export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
  get(_target, property, receiver) {
    return Reflect.get(getAuthClient(), property, receiver);
  },
});

export function clearAddinAuthSession() {
  // no-op in Storybook
}
