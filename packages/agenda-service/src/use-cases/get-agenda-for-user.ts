import { AgendaNotFoundError } from "../domain/errors";
import type { AgendaInstance } from "../domain/agenda-instance";
import type { AgendaServiceRepository } from "../repositories/agenda-service-repository";

export class GetAgendaForUser {
  constructor(private readonly repo: AgendaServiceRepository) {}

  async execute(input: { userId: string; documentAgendaId: string }): Promise<AgendaInstance> {
    const instance = await this.repo.findInstance(input);
    if (!instance) {
      throw new AgendaNotFoundError();
    }
    return instance;
  }
}
