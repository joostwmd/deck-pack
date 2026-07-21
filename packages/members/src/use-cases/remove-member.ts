import { InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type { MembersRepository } from "../repositories/members-repository";

export class RemoveMember {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: {
    organizationId: string;
    memberId: string;
  }): Promise<{ memberId: string }> {
    const result = await this.repo.removeMember(input);

    if (!result.ok) {
      if (result.reason === "not_found") {
        throw new NotFoundError("Member not found");
      }
      throw new InvalidStateError("Cannot remove the last organization owner");
    }

    return { memberId: input.memberId };
  }
}
