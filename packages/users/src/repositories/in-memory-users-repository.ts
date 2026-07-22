import { UserNotFoundError } from "../domain/errors";
import type { UserWithMembership } from "../domain/user";
import type { UsersRepository } from "./users-repository";

export class InMemoryUsersRepository implements UsersRepository {
  private users = new Map<string, UserWithMembership>();

  seed(users: UserWithMembership[]): void {
    for (const u of users) {
      this.users.set(u.id, u);
    }
  }

  async list(): Promise<UserWithMembership[]> {
    return [...this.users.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async delete(userId: string): Promise<{ userId: string }> {
    if (!this.users.has(userId)) {
      throw new UserNotFoundError(userId);
    }
    this.users.delete(userId);
    return { userId };
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    return this.users.get(userId)?.role === "admin";
  }
}
