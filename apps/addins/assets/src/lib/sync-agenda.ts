import type { AgendaConfigV1, AgendaEventType } from "@deck-pack/agenda";
import {
  buildAnalyticsMetadata,
  buildConfigurationHash,
  markEventSynced,
  queuePendingEvent,
} from "@deck-pack/agenda";

import type { AgendaStore } from "@/services/types";

export async function syncAgendaToCloud(
  agenda: AgendaStore,
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

  await agenda.sync(payload);
  return markEventSynced(config, eventId, config.revision);
}

export function queueAgendaCloudEvent(
  config: AgendaConfigV1,
  eventId: string,
): AgendaConfigV1 {
  return queuePendingEvent(config, eventId);
}

export async function retryPendingAgendaSync(
  agenda: AgendaStore,
  config: AgendaConfigV1,
  eventType: AgendaEventType = "updated",
): Promise<AgendaConfigV1> {
  let working = config;

  for (const eventId of config.cloudSync.pendingEventIds) {
    working = await syncAgendaToCloud(agenda, working, eventType, eventId);
  }

  return working;
}
