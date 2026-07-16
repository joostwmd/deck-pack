import type { AgendaConfigV1, AgendaEventType } from "@deck-pack/agenda";
import {
  buildAnalyticsMetadata,
  buildConfigurationHash,
  markEventSynced,
  queuePendingEvent,
} from "@deck-pack/agenda";

import type { TrpcClient } from "@/services/types";

export async function syncAgendaToCloud(
  api: TrpcClient,
  config: AgendaConfigV1,
  eventType: AgendaEventType,
  eventId: string,
  durationMs?: number,
): Promise<AgendaConfigV1> {
  const payload = {
    configuration: config,
    configurationHash: buildConfigurationHash(config),
    eventId,
    eventType,
    client: "office" as const,
    durationMs,
    metadata: buildAnalyticsMetadata(config),
  };

  await api.agenda.sync.mutate(payload);
  return markEventSynced(config, eventId, config.revision);
}

export function queueAgendaCloudEvent(
  config: AgendaConfigV1,
  eventId: string,
): AgendaConfigV1 {
  return queuePendingEvent(config, eventId);
}

export async function retryPendingAgendaSync(
  api: TrpcClient,
  config: AgendaConfigV1,
  eventType: AgendaEventType = "updated",
): Promise<AgendaConfigV1> {
  let working = config;

  for (const eventId of config.cloudSync.pendingEventIds) {
    working = await syncAgendaToCloud(api, working, eventType, eventId);
  }

  return working;
}
