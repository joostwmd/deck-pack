import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import {
  buildAgendaUpdatePlan,
  FIELD_ROLES,
  type AgendaSection,
} from "@deck-pack/agenda";
import {
  buildTemplateMapping,
  createInitialAgendaConfig,
  getAgendaSelectionSnapshot,
  validateTemplateMappingDraft,
  type TemplateMappingDraft,
} from "@deck-pack/office-js";
import { CircleNotch, ListBullets, Plus, Trash } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { useInsertSectionShortcutDefs } from "@/hooks/use-resolved-shortcut-defs";
import { queueAgendaCloudEvent, syncAgendaToCloud } from "@/lib/sync-agenda";
import {
  AUTHENTICATION_REQUIRED_MESSAGE,
  isAuthenticationError,
} from "@/lib/user-facing-api-error";
import { useServices } from "@/services/services-context";

type WizardStep = "structure" | "template" | "mapping" | "review";

type DraftSection = {
  sectionId: string;
  title: string;
  startSlideEntityId: string;
  nativeStartSlideIdHint: string;
};

interface AgendaSetupWizardProps {
  onComplete: () => void;
}

export function AgendaSetupWizard({ onComplete }: AgendaSetupWizardProps) {
  const { agenda } = useServices();
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();
  const [step, setStep] = useState<WizardStep>("structure");
  const [sections, setSections] = useState<DraftSection[]>([]);
  const [templateSlide, setTemplateSlide] = useState<{
    entityId: string;
    nativeSlideId: string;
  } | null>(null);
  const [headingShape, setHeadingShape] = useState<{
    entityId: string;
    nativeShapeId: string;
  } | null>(null);
  const [rowSlots, setRowSlots] = useState<TemplateMappingDraft["rowSlots"]>([]);
  const [activeStyleSlotId, setActiveStyleSlotId] = useState("");
  const [inactiveStyleSlotId, setInactiveStyleSlotId] = useState("");
  const [creating, setCreating] = useState(false);

  const capacity = rowSlots.length;

  const mappingErrors = useMemo(() => {
    if (!templateSlide || !headingShape) return [];
    return validateTemplateMappingDraft({
      templateSlideEntityId: templateSlide.entityId,
      nativeSlideIdHint: templateSlide.nativeSlideId,
      headingShapeEntityId: headingShape.entityId,
      nativeHeadingShapeIdHint: headingShape.nativeShapeId,
      rowSlots,
      activeStyleSlotId,
      inactiveStyleSlotId,
    });
  }, [
    activeStyleSlotId,
    headingShape,
    inactiveStyleSlotId,
    rowSlots,
    templateSlide,
  ]);

  const addCurrentSlideAsSection = useCallback(async () => {
    const selection = await getAgendaSelectionSnapshot();
    if (!selection.slide) {
      toast.error("Select a slide in PowerPoint first.");
      return;
    }

    const section: DraftSection = {
      sectionId: crypto.randomUUID(),
      title: selection.slide.title?.trim() || `Section ${sections.length + 1}`,
      startSlideEntityId: crypto.randomUUID(),
      nativeStartSlideIdHint: selection.slide.nativeSlideId,
    };

    setSections((current) => [...current, section]);
  }, [sections.length]);

  const captureTemplateSlide = useCallback(async () => {
    const selection = await getAgendaSelectionSnapshot();
    if (!selection.slide) {
      toast.error("Navigate to your agenda template slide first.");
      return;
    }

    setTemplateSlide({
      entityId: crypto.randomUUID(),
      nativeSlideId: selection.slide.nativeSlideId,
    });
  }, []);

  const captureHeadingShape = useCallback(async () => {
    const selection = await getAgendaSelectionSnapshot();
    if (!selection.shapes.length) {
      toast.error("Select the agenda heading shape in PowerPoint.");
      return;
    }

    setHeadingShape({
      entityId: crypto.randomUUID(),
      nativeShapeId: selection.shapes[0]!.nativeShapeId,
    });
  }, []);

  const captureRowSlot = useCallback(async () => {
    const selection = await getAgendaSelectionSnapshot();
    if (selection.shapes.length < 2) {
      toast.error("Select the section number, title, and page number shapes together.");
      return;
    }

    const sorted = [...selection.shapes].sort((left, right) => left.left - right.left);
    const slotId = crypto.randomUUID();
    const fields = [
      { shapeEntityId: crypto.randomUUID(), nativeShapeIdHint: sorted[0]!.nativeShapeId, fieldRole: FIELD_ROLES.SECTION_NUMBER },
      { shapeEntityId: crypto.randomUUID(), nativeShapeIdHint: sorted[1]!.nativeShapeId, fieldRole: FIELD_ROLES.SECTION_TITLE },
      ...(sorted[2]
        ? [{
            shapeEntityId: crypto.randomUUID(),
            nativeShapeIdHint: sorted[2]!.nativeShapeId,
            fieldRole: FIELD_ROLES.PAGE_NUMBER,
          }]
        : []),
    ] as TemplateMappingDraft["rowSlots"][number]["fields"];

    setRowSlots((current) => [...current, { slotId, fields }]);
    if (!activeStyleSlotId) setActiveStyleSlotId(slotId);
    if (!inactiveStyleSlotId) setInactiveStyleSlotId(slotId);
  }, [activeStyleSlotId, inactiveStyleSlotId]);

  const createAgenda = useCallback(async () => {
    if (!templateSlide || !headingShape || mappingErrors.length > 0) {
      toast.error("Complete template mapping before creating the agenda.");
      return;
    }

    if (sections.length > capacity) {
      toast.error(`This template supports up to ${capacity} sections.`);
      return;
    }

    setCreating(true);
    const startedAt = performance.now();

    try {
      const template = buildTemplateMapping({
        templateSlideEntityId: templateSlide.entityId,
        nativeSlideIdHint: templateSlide.nativeSlideId,
        headingShapeEntityId: headingShape.entityId,
        nativeHeadingShapeIdHint: headingShape.nativeShapeId,
        rowSlots,
        activeStyleSlotId,
        inactiveStyleSlotId,
      });

      const agendaSections: AgendaSection[] = sections.map((section) => ({
        sectionId: section.sectionId,
        title: section.title,
        startSlideEntityId: section.startSlideEntityId,
        nativeStartSlideIdHint: section.nativeStartSlideIdHint,
      }));

      const config = await createInitialAgendaConfig({
        agendaId: crypto.randomUUID(),
        template,
        sections: agendaSections,
      });

      const eventId = crypto.randomUUID();
      try {
        await syncAgendaToCloud(
          agenda,
          config,
          "created",
          eventId,
          Math.round(performance.now() - startedAt),
        );
      } catch (error) {
        queueAgendaCloudEvent(config, eventId);
        if (isAuthenticationError(error)) {
          toast.error(AUTHENTICATION_REQUIRED_MESSAGE);
        } else {
          toast.warning("Agenda created. Cloud sync is pending.");
        }
      }

      toast.success("Agenda created.");
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create agenda.");
    } finally {
      setCreating(false);
    }
  }, [
    agenda,
    capacity,
    headingShape,
    mappingErrors.length,
    onComplete,
    rowSlots,
    sections,
    templateSlide,
    activeStyleSlotId,
    inactiveStyleSlotId,
  ]);

  const reviewPlan = useMemo(() => {
    if (!templateSlide || sections.length === 0) return null;
    const draftConfig = {
      schemaVersion: 1 as const,
      agendaId: crypto.randomUUID(),
      revision: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      template: buildTemplateMapping({
        templateSlideEntityId: templateSlide.entityId,
        nativeSlideIdHint: templateSlide.nativeSlideId,
        headingShapeEntityId: headingShape?.entityId ?? crypto.randomUUID(),
        nativeHeadingShapeIdHint: headingShape?.nativeShapeId ?? "",
        rowSlots,
        activeStyleSlotId: activeStyleSlotId || rowSlots[0]?.slotId || crypto.randomUUID(),
        inactiveStyleSlotId: inactiveStyleSlotId || rowSlots[0]?.slotId || crypto.randomUUID(),
      }),
      sections: sections.map((section) => ({
        sectionId: section.sectionId,
        title: section.title,
        startSlideEntityId: section.startSlideEntityId,
        nativeStartSlideIdHint: section.nativeStartSlideIdHint,
      })),
      generatedSlides: [],
      options: {
        openingTocEnabled: true,
        dividersEnabled: true,
        fullAgendaMode: true,
        physicalPageNumbers: true,
      },
      cloudSync: { lastSyncedRevision: 0, pendingEventIds: [] },
    };

    return buildAgendaUpdatePlan({
      config: draftConfig,
      deck: { slides: [], shapes: [] },
    });
  }, [
    activeStyleSlotId,
    headingShape,
    inactiveStyleSlotId,
    rowSlots,
    sections,
    templateSlide,
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ScreenHeader
        title="Set up agenda"
        text={
          step === "structure"
            ? "Add each section from the slide where it begins."
            : step === "template"
              ? "Choose the branded agenda slide DeckPack should reuse."
              : step === "mapping"
                ? "Map the heading and each fixed row slot in your template."
                : "Review what DeckPack will create before applying changes."
        }
      />

      {step === "structure" ? (
        <div className="space-y-3">
          {sections.length === 0 ? (
            <EmptyState
              icon={ListBullets}
              title="No sections yet"
              description="Navigate to the first slide of a section, then add it here."
            />
          ) : (
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div key={section.sectionId} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-8">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Input
                      value={section.title}
                      onChange={(event) =>
                        setSections((current) =>
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
                        setSections((current) =>
                          current.filter((item) => item.sectionId !== section.sectionId),
                        )
                      }
                    >
                      <Trash className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => void addCurrentSlideAsSection()}>
            <Plus className="size-4" />
            Add current slide as section
          </Button>

          <Button
            className="w-full"
            disabled={sections.length === 0}
            onClick={() => setStep("template")}
          >
            Continue
          </Button>
        </div>
      ) : null}

      {step === "template" ? (
        <div className="space-y-3">
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            The selected slide becomes your opening table of contents and the reusable template.
          </p>
          <Button variant="outline" className="w-full" onClick={() => void captureTemplateSlide()}>
            Use current slide
          </Button>
          {templateSlide ? (
            <p className="text-sm text-muted-foreground">
              Template captured from slide {templateSlide.nativeSlideId}.
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("structure")}>
              Back
            </Button>
            <Button className="flex-1" disabled={!templateSlide} onClick={() => setStep("mapping")}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "mapping" ? (
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => void captureHeadingShape()}>
            Assign selected shape as heading
          </Button>
          <Button variant="outline" className="w-full" onClick={() => void captureRowSlot()}>
            Add row slot from current selection
          </Button>
          <p className="text-sm text-muted-foreground">
            Capacity: {capacity} section{capacity === 1 ? "" : "s"}
          </p>
          {mappingErrors.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("template")}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={mappingErrors.length > 0 || capacity === 0}
              onClick={() => setStep("review")}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-3">
          <div className="rounded-xl border p-4 text-sm space-y-1">
            <p>{sections.length} sections</p>
            <p>{capacity} template row slots</p>
            <p>{1 + sections.length} generated slides expected</p>
            {reviewPlan ? (
              <p>{reviewPlan.summary.updatedSlides} slide updates planned</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("mapping")}>
              Back
            </Button>
            <Button className="flex-1" disabled={creating} onClick={() => void createAgenda()}>
              {creating ? <CircleNotch className="size-4 animate-spin" /> : null}
              Create agenda
            </Button>
          </div>
        </div>
      ) : null}

      <InsertSection
        label="Create agenda"
        insertingLabel="Creating..."
        isInserting={creating}
        disabled
        shortcutDefs={insertSectionShortcutDefs}
        onClick={() => undefined}
      />
    </div>
  );
}
