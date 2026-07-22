import { CannotDeleteSelfError } from "../domain/errors";
import type { UsersRepository } from "../repositories/users-repository";

export class DeleteUser {
  constructor(private readonly repo: UsersRepository) {}

  async execute(input: { userId: string; actorUserId: string }): Promise<{ userId: string }> {
    if (input.userId === input.actorUserId) {
      throw new CannotDeleteSelfError();
    }
    return this.repo.delete(input.userId);
  }
}
