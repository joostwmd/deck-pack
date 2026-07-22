import { ConflictError, InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type { JoinResult } from "../domain/member";
import type { MembersRepository } from "../repositories/members-repository";

export class AcceptInvitation {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: {
    invitationId: string;
    userId: string;
    sessionId: string;
    confirmReplace: boolean;
  }): Promise<JoinResult> {
    const invite = await this.repo.getInvitationById(input.invitationId);
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    if (invite.status !== "pending") {
      throw new InvalidStateError("Invitation is no longer pending");
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new InvalidStateError("Invitation has expired");
    }

    const current = await this.repo.getCurrentMembershipSummary(input.userId);
    let vacatedAction: "deleted" | "left" | null = null;

    if (current) {
      if (current.organizationId === invite.organizationId) {
        throw new ConflictError("You are already a member of this organization");
      }

      if (current.blockedSoleOwner) {
        throw new InvalidStateError(
          "You are the sole owner of an organization with other members. Transfer ownership before joining another organization.",
        );
      }

      if (!input.confirmReplace) {
        throw new ConflictError(
          "You already belong to an organization. Confirm replacing it to continue.",
        );
      }

      const vacated = await this.repo.vacateCurrentOrganization(input.userId);
      if (!vacated.ok) {
        if (vacated.reason === "sole_owner_with_other_members") {
          throw new InvalidStateError(
            "You are the sole owner of an organization with other members. Transfer ownership before joining another organization.",
          );
        }
        throw new InvalidStateError("Could not leave your current organization");
      }
      vacatedAction = vacated.action;
    }

    const accepted = await this.repo.acceptInvitationForUser({
      invitationId: input.invitationId,
      userId: input.userId,
    });

    if (!accepted.ok) {
      const messages: Record<string, string> = {
        not_found: "Invitation not found",
        not_pending: "Invitation is no longer pending",
        expired: "Invitation has expired",
        email_mismatch: "This invitation was sent to a different email address",
        user_not_found: "User not found",
        already_member: "You are already a member of this organization",
        user_in_other_org: "You still belong to another organization",
      };
      throw new ConflictError(messages[accepted.reason] ?? "Could not accept invitation");
    }

    const { workspace } = await this.repo.setSessionActiveOrganization({
      userId: input.userId,
      organizationId: accepted.organizationId,
      sessionId: input.sessionId,
    });

    return {
      organizationId: accepted.organizationId,
      workspace,
      vacatedAction,
    };
  }
}
