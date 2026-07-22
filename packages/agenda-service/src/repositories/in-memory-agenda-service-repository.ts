import type { AgendaInstance, SyncAgendaRepoInput } from "../domain/agenda-instance";
import type { AgendaServiceRepository } from "./agenda-service-repository";

export class InMemoryAgendaServiceRepository implements AgendaServiceRepository {
  private instances = new Map<string, AgendaInstance>();

  private key(userId: string, documentAgendaId: string): string {
    return `${userId}:${documentAgendaId}`;
  }

  seed(instances: AgendaInstance[]): void {
    for (const instance of instances) {
      this.instances.set(
        this.key(instance.userId, instance.documentAgendaId),
        structuredClone(instance),
      );
    }
  }

  async findInstance(input: {
    userId: string;
    documentAgendaId: string;
  }): Promise<AgendaInstance | null> {
    return this.instances.get(this.key(input.userId, input.documentAgendaId)) ?? null;
  }

  async sync(input: SyncAgendaRepoInput): Promise<AgendaInstance | null> {
    const key = this.key(input.userId, input.documentAgendaId);
    const existing = this.instances.get(key);
    const now = new Date();

    if (!existing) {
      const created: AgendaInstance = {
        id: crypto.randomUUID(),
        userId: input.userId,
        documentAgendaId: input.documentAgendaId,
        schemaVersion: input.schemaVersion,
        revision: input.revision,
        configuration: input.configuration,
        configurationHash: input.configurationHash,
        sectionCount: input.sectionCount,
        generatedSlideCount: input.generatedSlideCount,
        updatedAt: now,
        lastSyncedAt: now,
      };
      this.instances.set(key, created);
      return structuredClone(created);
    }

    if (input.skipSnapshotUpdate) {
      return structuredClone(existing);
    }

    const updated: AgendaInstance = {
      ...existing,
      schemaVersion: input.schemaVersion,
      revision: input.revision,
      configuration: input.configuration,
      configurationHash: input.configurationHash,
      sectionCount: input.sectionCount,
      generatedSlideCount: input.generatedSlideCount,
      updatedAt: now,
      lastSyncedAt: now,
    };
    this.instances.set(key, updated);
    return structuredClone(updated);
  }
}
