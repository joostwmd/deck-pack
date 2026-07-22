import type { MemberListEntry } from "../domain/member";
import type { MembersRepository } from "../repositories/members-repository";

export class ListMembers {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: { organizationId: string }): Promise<MemberListEntry[]> {
    const [members, invitations] = await Promise.all([
      this.repo.listMembers(input.organizationId),
      this.repo.listPendingInvitations(input.organizationId),
    ]);

    const memberEntries: MemberListEntry[] = members.map((row) => ({
      kind: "member" as const,
      id: row.memberId,
      email: row.email,
      name: row.name,
      role: row.role,
      status: "active" as const,
      createdAt: row.createdAt,
    }));

    const invitationEntries: MemberListEntry[] = invitations.map((row) => ({
      kind: "invitation" as const,
      id: row.invitationId,
      email: row.email,
      name: null,
      role: row.role ?? "organizationMember",
      status: "invited" as const,
      createdAt: row.createdAt,
    }));

    return [...memberEntries, ...invitationEntries].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }
}
