import type { SeatCapacity } from "../domain/seat";
import type { SeatsRepository } from "../repositories/seats-repository";

export class GetSeatCapacity {
  constructor(private readonly repo: SeatsRepository) {}

  async execute(input: { organizationId: string }): Promise<SeatCapacity> {
    return this.repo.capacity(input.organizationId);
  }
}
