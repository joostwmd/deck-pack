import { NotFoundError } from "@deck-pack/errors";

import type { MembersRepository } from "../repositories/members-repository";

export class CancelInvitation {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: {
    organizationId: string;
    invitationId: string;
  }): Promise<{ invitationId: string }> {
    const result = await this.repo.cancelInvitation(input);

    if (!result.ok) {
      throw new NotFoundError("Invitation not found");
    }

    return { invitationId: input.invitationId };
  }
}
