import type { PendingJoin } from "../domain/member";
import type { MembersRepository } from "../repositories/members-repository";
import { membershipImpact } from "./membership-impact";

export class GetPendingJoin {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: { userId: string; userEmail: string }): Promise<PendingJoin | null> {
    const intent = await this.repo.findPendingOrgIntentByEmail(input.userEmail);
    if (!intent) {
      return null;
    }

    const current = await this.repo.getCurrentMembershipSummary(input.userId);

    if (current?.organizationId === intent.organizationId) {
      return null;
    }

    // Seat auto-activates when user has no org; only surface when replace is needed
    // or when invitation is pending (always needs accept).
    if (intent.kind === "seat" && !current) {
      return null;
    }

    return {
      kind: intent.kind,
      invitationId: intent.kind === "invitation" ? intent.invitationId : undefined,
      seatId: intent.kind === "seat" ? intent.seatId : undefined,
      organizationId: intent.organizationId,
      organizationName: intent.organizationName,
      role: intent.kind === "invitation" ? intent.role : null,
      currentMembership: membershipImpact(current),
    };
  }
}
