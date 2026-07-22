import { ForbiddenError, NotFoundError } from "@deck-pack/errors";

import type { InvitationPreview } from "../domain/member";
import type { MembersRepository } from "../repositories/members-repository";
import { membershipImpact } from "./membership-impact";

export class GetInvitationPreview {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: {
    invitationId: string;
    userId: string;
    userEmail: string;
  }): Promise<InvitationPreview> {
    const invite = await this.repo.getInvitationById(input.invitationId);
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }

    if (invite.email.toLowerCase() !== input.userEmail.toLowerCase()) {
      throw new ForbiddenError("This invitation was sent to a different email address");
    }

    const current = await this.repo.getCurrentMembershipSummary(input.userId);

    return {
      invitationId: invite.invitationId,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      organizationId: invite.organizationId,
      organizationName: invite.organizationName,
      organizationType: invite.organizationType,
      status: invite.status,
      currentMembership: membershipImpact(current),
    };
  }
}
