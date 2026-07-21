import { ConflictError, InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type { JoinResult } from "../domain/member";
import type { MembersRepository } from "../repositories/members-repository";

export class AcceptPendingSeat {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: {
    userId: string;
    userEmail: string;
    sessionId: string;
    confirmReplace: boolean;
  }): Promise<JoinResult> {
    const intent = await this.repo.findPendingOrgIntentByEmail(input.userEmail);

    if (!intent || intent.kind !== "seat") {
      throw new NotFoundError("No pending seat assignment found");
    }

    const current = await this.repo.getCurrentMembershipSummary(input.userId);
    let vacatedAction: "deleted" | "left" | null = null;

    if (current) {
      if (current.organizationId === intent.organizationId) {
        const activated = await this.repo.activateSeatForUser({
          userId: input.userId,
          email: input.userEmail,
        });
        if (!activated.ok) {
          throw new ConflictError("Could not activate seat");
        }
        const { workspace } = await this.repo.setSessionActiveOrganization({
          userId: input.userId,
          organizationId: intent.organizationId,
          sessionId: input.sessionId,
        });
        return {
          organizationId: intent.organizationId,
          workspace,
          vacatedAction: null,
        };
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

    const activated = await this.repo.activateSeatForUser({
      userId: input.userId,
      email: input.userEmail,
    });

    if (!activated.ok) {
      throw new ConflictError(
        activated.reason === "user_in_other_org"
          ? "You still belong to another organization"
          : "No pending seat assignment found",
      );
    }

    const { workspace } = await this.repo.setSessionActiveOrganization({
      userId: input.userId,
      organizationId: activated.organizationId,
      sessionId: input.sessionId,
    });

    return {
      organizationId: activated.organizationId,
      workspace,
      vacatedAction,
    };
  }
}
