import { InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type { MembersRepository } from "../repositories/members-repository";

export class UpdateMemberRole {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: {
    organizationId: string;
    memberId: string;
    role: string;
  }): Promise<{ memberId: string }> {
    const result = await this.repo.updateMemberRole(input);

    if (!result.ok) {
      if (result.reason === "not_found") {
        throw new NotFoundError("Member not found");
      }
      if (result.reason === "cannot_demote_last_owner") {
        throw new InvalidStateError("Cannot change role of the last organization owner");
      }
      throw new InvalidStateError("Invalid role change");
    }

    return { memberId: input.memberId };
  }
}
