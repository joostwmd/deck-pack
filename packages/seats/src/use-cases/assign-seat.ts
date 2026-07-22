import { AssignedSeatMissingError } from "../domain/errors";
import type { AssignSeatInput, OrganizationSeat } from "../domain/seat";
import type { SeatsRepository } from "../repositories/seats-repository";

export class AssignSeat {
  constructor(private readonly repo: SeatsRepository) {}

  async execute(input: AssignSeatInput): Promise<OrganizationSeat> {
    const assigned = await this.repo.assign(input);
    const seats = await this.repo.list(input.organizationId);
    const seat = seats.find((row) => row.seatId === assigned.seatId);
    if (!seat) {
      throw new AssignedSeatMissingError();
    }
    return seat;
  }
}
