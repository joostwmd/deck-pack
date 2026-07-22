import { UserNotFoundError } from "../domain/errors";
import type { UserWithMembership } from "../domain/user";
import type { UserMembership, UsersRepository } from "./users-repository";

export class InMemoryUsersRepository implements UsersRepository {
  private users = new Map<string, UserWithMembership>();
  private memberships = new Map<string, UserMembership[]>();

  seed(users: UserWithMembership[]): void {
    for (const u of users) {
      this.users.set(u.id, u);
      if (u.organizationId && u.memberRole) {
        this.memberships.set(u.id, [
          {
            organizationId: u.organizationId,
            organizationType: u.organizationType,
            memberRole: u.memberRole,
          },
        ]);
      }
    }
  }

  seedMemberships(userId: string, memberships: UserMembership[]): void {
    this.memberships.set(userId, memberships);
  }

  async list(): Promise<UserWithMembership[]> {
    return [...this.users.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async listMemberships(userId: string): Promise<UserMembership[]> {
    return this.memberships.get(userId) ?? [];
  }

  async delete(userId: string): Promise<{ userId: string }> {
    if (!this.users.has(userId)) {
      throw new UserNotFoundError(userId);
    }
    this.users.delete(userId);
    this.memberships.delete(userId);
    return { userId };
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    return this.users.get(userId)?.role === "admin";
  }
}
