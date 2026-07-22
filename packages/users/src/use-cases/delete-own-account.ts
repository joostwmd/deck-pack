import { CannotDeleteTeamOwnerError } from "../domain/errors";
import type { UsersRepository } from "../repositories/users-repository";

const OWNER_ROLE = "organizationOwner";

export type DeleteOrganizationFn = (organizationId: string) => Promise<unknown>;

export class DeleteOwnAccount {
  constructor(
    private readonly users: UsersRepository,
    private readonly deleteOrganization: DeleteOrganizationFn,
  ) {}

  async execute(input: { userId: string }): Promise<{ userId: string }> {
    const memberships = await this.users.listMemberships(input.userId);

    const ownsTeamOrg = memberships.some(
      (membership) =>
        membership.memberRole === OWNER_ROLE && membership.organizationType === "team",
    );
    if (ownsTeamOrg) {
      throw new CannotDeleteTeamOwnerError();
    }

    const soloOrgIds = memberships
      .filter(
        (membership) =>
          membership.memberRole === OWNER_ROLE && membership.organizationType === "individual",
      )
      .map((membership) => membership.organizationId);

    for (const organizationId of soloOrgIds) {
      await this.deleteOrganization(organizationId);
    }

    return this.users.delete(input.userId);
  }
}
