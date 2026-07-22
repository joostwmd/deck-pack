export type AgendaInstance = {
  id: string;
  userId: string;
  documentAgendaId: string;
  schemaVersion: number;
  revision: number;
  configuration: Record<string, unknown>;
  configurationHash: string;
  sectionCount: number;
  generatedSlideCount: number;
  updatedAt: Date;
  lastSyncedAt: Date;
};

export type SyncAgendaRepoInput = {
  userId: string;
  documentAgendaId: string;
  schemaVersion: number;
  revision: number;
  configuration: Record<string, unknown>;
  configurationHash: string;
  sectionCount: number;
  generatedSlideCount: number;
  skipSnapshotUpdate?: boolean;
  event: {
    id: string;
    eventType: string;
    client: string;
    revision: number;
    durationMs?: number;
    metadata?: Record<string, unknown>;
  };
};
