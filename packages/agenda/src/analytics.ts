import type { AgendaAnalyticsMetadata, AgendaConfigV1, AgendaUpdatePlan } from "./types";

export function buildConfigurationHash(config: AgendaConfigV1): string {
  const payload = JSON.stringify({
    agendaId: config.agendaId,
    revision: config.revision,
    sections: config.sections.map((section) => ({
      sectionId: section.sectionId,
      title: section.title,
      startSlideEntityId: section.startSlideEntityId,
    })),
    generatedSlides: config.generatedSlides.map((slide) => ({
      entityId: slide.entityId,
      role: slide.role,
      sectionId: slide.sectionId,
    })),
    template: {
      templateSlideEntityId: config.template.templateSlideEntityId,
      capacity: config.template.capacity,
      rowSlots: config.template.rowSlots.length,
    },
    options: config.options,
  });

  let hash = 0;
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash * 31 + payload.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export function buildAnalyticsMetadata(
  config: AgendaConfigV1,
  plan?: AgendaUpdatePlan,
  repaired = false,
): AgendaAnalyticsMetadata {
  return {
    sectionCount: config.sections.length,
    generatedSlideCount: config.generatedSlides.length,
    createdDividers: plan?.summary.createdDividers,
    deletedSlides: plan?.summary.deletedSlides,
    movedSlides: plan?.summary.movedSlides,
    updatedSlides: plan?.summary.updatedSlides,
    renamedSections: plan?.summary.renamedSections,
    pageNumberRefreshes: plan?.summary.pageNumberRefreshes,
    repaired,
  };
}

export function queuePendingEvent(config: AgendaConfigV1, eventId: string): AgendaConfigV1 {
  if (config.cloudSync.pendingEventIds.includes(eventId)) {
    return config;
  }

  return {
    ...config,
    cloudSync: {
      ...config.cloudSync,
      pendingEventIds: [...config.cloudSync.pendingEventIds, eventId],
    },
  };
}

export function markEventSynced(config: AgendaConfigV1, eventId: string, revision: number): AgendaConfigV1 {
  return {
    ...config,
    cloudSync: {
      lastSyncedRevision: Math.max(config.cloudSync.lastSyncedRevision, revision),
      pendingEventIds: config.cloudSync.pendingEventIds.filter((id) => id !== eventId),
    },
  };
}
