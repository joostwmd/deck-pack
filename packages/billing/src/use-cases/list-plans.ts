import type { Plan } from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class ListPlans {
  constructor(private readonly repo: BillingRepository) {}

  async execute(): Promise<Plan[]> {
    return this.repo.listPlans();
  }
}
