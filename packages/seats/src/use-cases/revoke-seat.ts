import type { RevokeSeatInput } from "../domain/seat";
import type { SeatsRepository } from "../repositories/seats-repository";

export class RevokeSeat {
  constructor(private readonly repo: SeatsRepository) {}

  async execute(input: RevokeSeatInput): Promise<{ seatId: string }> {
    return this.repo.revoke(input);
  }
}
