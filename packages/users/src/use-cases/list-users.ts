import type { UserWithMembership } from "../domain/user";
import type { UsersRepository } from "../repositories/users-repository";

export class ListUsers {
  constructor(private readonly repo: UsersRepository) {}

  async execute(): Promise<UserWithMembership[]> {
    return this.repo.list();
  }
}
