import type { OrganizationSeat } from "../domain/seat";
import type { SeatsRepository } from "../repositories/seats-repository";

export class ListSeats {
  constructor(private readonly repo: SeatsRepository) {}

  async execute(input: { organizationId: string }): Promise<OrganizationSeat[]> {
    return this.repo.list(input.organizationId);
  }
}
