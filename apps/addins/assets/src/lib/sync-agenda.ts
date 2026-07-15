import {
  buildAnalyticsMetadata,
  buildConfigurationHash,
  markEventSynced,
  queuePendingEvent,
  type AgendaConfigV1,
  type AgendaEventType,
} from "@deck-pack/agenda";

import { trpcClient } from "@/utils/trpc";

export async function syncAgendaToCloud(
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

  await trpcClient.agenda.sync.mutate(payload);
  return markEventSynced(config, eventId, config.revision);
}

export function queueAgendaCloudEvent(
  config: AgendaConfigV1,
  eventId: string,
): AgendaConfigV1 {
  return queuePendingEvent(config, eventId);
}

export async function retryPendingAgendaSync(
  config: AgendaConfigV1,
  eventType: AgendaEventType = "updated",
): Promise<AgendaConfigV1> {
  let working = config;

  for (const eventId of config.cloudSync.pendingEventIds) {
    working = await syncAgendaToCloud(working, eventType, eventId);
  }

  return working;
}
