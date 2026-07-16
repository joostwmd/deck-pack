import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import {
  buildAgendaUpdatePlan,
  getSectionPageNumber,
  reconcileAgendaConfig,
  sortSectionsBySlideIndex,
  type AgendaConfigV1,
  type AgendaSection,
} from "@deck-pack/agenda";
import {
  getAgendaSelectionSnapshot,
  persistAgendaConfig,
  scanAgendaDeck,
  updateAgendaFromDraft,
} from "@deck-pack/office-js";
import { CircleNotch, ListBullets, Plus, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { useInsertSectionShortcutDefs } from "@/hooks/use-resolved-shortcut-defs";
import { queueAgendaCloudEvent, retryPendingAgendaSync, syncAgendaToCloud } from "@/lib/sync-agenda";
import {
  AUTHENTICATION_REQUIRED_MESSAGE,
  isAuthenticationError,
} from "@/lib/user-facing-api-error";
import { useServices } from "@/services/services-context";

import type { AgendaChangePreview, AgendaDraftSection, AgendaEditorStatus } from "../types";

interface AgendaEditorProps {
  initialConfig: AgendaConfigV1;
  onConfigChange: (config: AgendaConfigV1) => void;
}

function deriveStatus(
  config: AgendaConfigV1,
  draftSections: AgendaSection[],
  issues: ReturnType<typeof reconcileAgendaConfig>["issues"],
): AgendaEditorStatus {
  if (issues.some((issue) => issue.code === "template_missing")) {
    return "template_invalid";
  }
  if (issues.some((issue) => issue.code === "missing_divider" || issue.code === "missing_opening_toc")) {
    return "repair_required";
  }
  if (issues.length > 0) {
    return "presentation_changed";
  }

  const draftIds = draftSections.map((section) => `${section.sectionId}:${section.title}`).join("|");
  const configIds = config.sections.map((section) => `${section.sectionId}:${section.title}`).join("|");
  if (draftIds !== configIds) {
    return "changes_pending";
  }

  return "up_to_date";
}

export function AgendaEditor({ initialConfig, onConfigChange }: AgendaEditorProps) {
  const { api } = useServices();
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();
  const [config, setConfig] = useState(initialConfig);
  const [draftSections, setDraftSections] = useState<AgendaDraftSection[]>([]);
  const [issues, setIssues] = useState<ReturnType<typeof reconcileAgendaConfig>["issues"]>([]);
  const [preview, setPreview] = useState<AgendaChangePreview | null>(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const deck = await scanAgendaDeck();
      const reconciled = reconcileAgendaConfig(config, deck);
      const sorted = sortSectionsBySlideIndex(reconciled.config.sections, deck);
      setIssues(reconciled.issues);
      setDraftSections(
        sorted.map((section) => ({
          ...section,
          pageNumber: getSectionPageNumber(section, deck),
        })),
      );
      if (reconciled.config.revision !== config.revision || JSON.stringify(reconciled.config.sections) !== JSON.stringify(config.sections)) {
        setConfig(reconciled.config);
        onConfigChange(reconciled.config);
        await persistAgendaConfig(reconciled.config);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to scan presentation.");
    } finally {
      setLoading(false);
    }
  }, [config, onConfigChange]);

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (config.cloudSync.pendingEventIds.length > 0) {
      void retryPendingAgendaSync(api, config, "updated")
        .then((synced) => {
          setConfig(synced);
          onConfigChange(synced);
        })
        .catch(() => undefined);
    }
  }, [api, config, onConfigChange]);

  const status = useMemo(
    () => deriveStatus(config, draftSections, issues),
    [config, draftSections, issues],
  );

  const addCurrentSlideAsSection = useCallback(async () => {
    const selection = await getAgendaSelectionSnapshot();
    if (!selection.slide) {
      toast.error("Select a slide in PowerPoint first.");
      return;
    }

    if (draftSections.length >= config.template.capacity) {
      toast.error(`This template supports up to ${config.template.capacity} sections.`);
      return;
    }

    setDraftSections((current) => [
      ...current,
      {
        sectionId: crypto.randomUUID(),
        title: selection.slide!.title?.trim() || `Section ${current.length + 1}`,
        startSlideEntityId: crypto.randomUUID(),
        nativeStartSlideIdHint: selection.slide!.nativeSlideId,
        pageNumber: selection.slide!.index + 1,
      },
    ]);
  }, [config.template.capacity, draftSections.length]);

  const buildPreview = useCallback(async () => {
    const deck = await scanAgendaDeck();
    const draftConfig: AgendaConfigV1 = {
      ...config,
      sections: draftSections,
    };
    const plan = buildAgendaUpdatePlan({
      config: draftConfig,
      deck,
      previousSections: config.sections,
    });
    setPreview(plan.summary);
  }, [config, draftSections]);

  const updateAgenda = useCallback(async () => {
    setUpdating(true);
    const startedAt = performance.now();
    try {
      const nextConfig = await updateAgendaFromDraft(
        config,
        draftSections.map(({ sectionId, title, startSlideEntityId, nativeStartSlideIdHint }) => ({
          sectionId,
          title,
          startSlideEntityId,
          nativeStartSlideIdHint,
        })),
      );
      setConfig(nextConfig);
      onConfigChange(nextConfig);

      const eventId = crypto.randomUUID();
      try {
        const synced = await syncAgendaToCloud(
          api,
          nextConfig,
          status === "repair_required" ? "repaired" : "updated",
          eventId,
          Math.round(performance.now() - startedAt),
        );
        setConfig(synced);
        onConfigChange(synced);
      } catch (error) {
        const queued = queueAgendaCloudEvent(nextConfig, eventId);
        setConfig(queued);
        onConfigChange(queued);
        if (isAuthenticationError(error)) {
          toast.error(AUTHENTICATION_REQUIRED_MESSAGE);
        } else {
          toast.warning("Agenda updated. Cloud sync is pending.");
        }
      }

      toast.success("Agenda updated.");
      setPreview(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update agenda.");
    } finally {
      setUpdating(false);
    }
  }, [api, config, draftSections, onConfigChange, refresh, status]);

  const statusLabel =
    status === "up_to_date"
      ? "Up to date"
      : status === "changes_pending"
        ? "Changes pending"
        : status === "presentation_changed"
          ? "Presentation changed"
          : status === "repair_required"
            ? "Repair required"
            : "Template invalid";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ScreenHeader
        title="Agenda"
        text={`${draftSections.length} sections · ${statusLabel}`}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleNotch className="size-4 animate-spin" />
          Scanning presentation...
        </div>
      ) : null}

      {issues.length > 0 ? (
        <div className="space-y-2">
          {issues.map((issue) => (
            <p
              key={`${issue.code}-${issue.entityId ?? issue.sectionId ?? issue.message}`}
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs"
            >
              {issue.message}
            </p>
          ))}
        </div>
      ) : null}

      {draftSections.length === 0 ? (
        <EmptyState
          icon={ListBullets}
          title="No sections configured"
          description="Add a section from the slide where it begins."
        />
      ) : (
        <div className="space-y-2">
          {draftSections.map((section, index) => (
            <div key={section.sectionId} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Input
                  value={section.title}
                  onChange={(event) =>
                    setDraftSections((current) =>
                      current.map((item) =>
                        item.sectionId === section.sectionId
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setDraftSections((current) =>
                      current.filter((item) => item.sectionId !== section.sectionId),
                    )
                  }
                >
                  <Trash className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                Starts at slide {section.pageNumber ?? "unknown"}
              </p>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={() => void addCurrentSlideAsSection()}>
        <Plus className="size-4" />
        Add current slide as section
      </Button>

      {preview ? (
        <div className="rounded-xl border p-4 text-sm space-y-1">
          <p>{preview.createdDividers} dividers to create</p>
          <p>{preview.updatedSlides} slide updates</p>
          <p>{preview.pageNumberRefreshes} page numbers to refresh</p>
        </div>
      ) : null}

      <div className="mt-auto space-y-2">
        <Button variant="outline" className="w-full" onClick={() => void buildPreview()}>
          Review changes
        </Button>
        <InsertSection
          label="Update agenda"
          insertingLabel="Updating..."
          isInserting={updating}
          disabled={status === "up_to_date" || status === "template_invalid" || updating}
          shortcutDefs={insertSectionShortcutDefs}
          onClick={() => void updateAgenda()}
        />
      </div>
    </div>
  );
}
