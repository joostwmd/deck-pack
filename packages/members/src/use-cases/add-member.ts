import { ConflictError, ForbiddenError } from "@deck-pack/errors";

import type { AddMemberInput, AddMemberResult } from "../domain/member";
import type { InvitationPort } from "../integrations/invitation-port";
import type { MembersRepository } from "../repositories/members-repository";

export class AddMember {
  constructor(
    private readonly repo: MembersRepository,
    private readonly invitationPort: InvitationPort,
  ) {}

  async execute(input: AddMemberInput): Promise<AddMemberResult> {
    const existingUser = await this.repo.findUserByEmail(input.email);

    if (existingUser && !existingUser.hasOrg) {
      const added = await this.repo.addMember({
        organizationId: input.organizationId,
        userId: existingUser.id,
        role: input.role,
      });

      if (!added.ok) {
        throw new ConflictError("User could not be added to organization");
      }

      if (input.assignSeat) {
        const seat = await this.repo.assignSeat({
          organizationId: input.organizationId,
          email: input.email,
          assignedBy: input.inviterId,
          userId: existingUser.id,
          status: "active",
        });

        if (!seat.ok) {
          const seatMessages: Record<string, string> = {
            no_subscription: "Organization has no active subscription",
            at_capacity: "All purchased seats are assigned",
            email_already_assigned: "This email already has a seat assignment",
            user_in_other_org: "User already belongs to another organization",
          };
          throw new ConflictError(seatMessages[seat.reason] ?? "Could not assign seat");
        }
      }

      return { kind: "member", memberId: added.memberId };
    }

    const invited = await this.invitationPort.createInvitation({
      email: input.email,
      role: input.role,
      organizationId: input.organizationId,
      headers: input.headers,
    });

    if (!invited.ok) {
      const message =
        invited.reason === "already_member"
          ? "User is already a member"
          : invited.reason === "already_invited"
            ? "An invitation is already pending for this email"
            : invited.message;
      if (invited.reason === "forbidden") {
        throw new ForbiddenError(message);
      }
      throw new ConflictError(message);
    }

    if (input.assignSeat) {
      const seat = await this.repo.assignSeat({
        organizationId: input.organizationId,
        email: input.email,
        assignedBy: input.inviterId,
      });

      if (!seat.ok) {
        throw new ConflictError("Member invited but seat could not be assigned");
      }
    }

    return { kind: "invitation", invitationId: invited.invitationId };
  }
}
