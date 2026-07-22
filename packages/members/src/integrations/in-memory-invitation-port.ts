import type {
  CreateInvitationInput,
  CreateInvitationViaAuthResult,
  InvitationPort,
} from "./invitation-port";

export class InMemoryInvitationPort implements InvitationPort {
  readonly calls: CreateInvitationInput[] = [];
  private nextResult: CreateInvitationViaAuthResult = {
    ok: true,
    invitationId: "invite-fake-1",
  };

  setNextResult(result: CreateInvitationViaAuthResult): void {
    this.nextResult = result;
  }

  async createInvitation(input: CreateInvitationInput): Promise<CreateInvitationViaAuthResult> {
    this.calls.push(input);
    return this.nextResult;
  }
}
