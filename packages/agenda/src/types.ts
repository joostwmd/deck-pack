import type { AGENDA_EVENT_TYPES, AGENDA_ROLES, FIELD_ROLES } from "./constants";

export type AgendaRole = (typeof AGENDA_ROLES)[keyof typeof AGENDA_ROLES];
export type FieldRole = (typeof FIELD_ROLES)[keyof typeof FIELD_ROLES];
export type AgendaEventType = (typeof AGENDA_EVENT_TYPES)[number];

export type AgendaFieldMapping = {
  shapeEntityId: string;
  nativeShapeIdHint?: string;
  fieldRole: FieldRole;
};

export type AgendaRowSlot = {
  slotId: string;
  fields: AgendaFieldMapping[];
};

export type AgendaTemplateMapping = {
  templateSlideEntityId: string;
  nativeSlideIdHint?: string;
  headingShapeEntityId: string;
  nativeHeadingShapeIdHint?: string;
  rowSlots: AgendaRowSlot[];
  activeStyleSlotId: string;
  inactiveStyleSlotId: string;
  capacity: number;
};

export type AgendaSection = {
  sectionId: string;
  title: string;
  startSlideEntityId: string;
  nativeStartSlideIdHint?: string;
};

export type GeneratedSlideRef = {
  entityId: string;
  role: AgendaRole;
  sectionId?: string;
  nativeSlideIdHint?: string;
};

export type AgendaOptions = {
  openingTocEnabled: boolean;
  dividersEnabled: boolean;
  fullAgendaMode: boolean;
  physicalPageNumbers: boolean;
};

export type AgendaCloudSync = {
  lastSyncedRevision: number;
  pendingEventIds: string[];
};

export type AgendaConfigV1 = {
  schemaVersion: 1;
  agendaId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  template: AgendaTemplateMapping;
  sections: AgendaSection[];
  generatedSlides: GeneratedSlideRef[];
  options: AgendaOptions;
  cloudSync: AgendaCloudSync;
};

export type ObservedSlide = {
  nativeSlideId: string;
  index: number;
  title: string | null;
  tags: Record<string, string>;
};

export type ObservedShape = {
  nativeShapeId: string;
  nativeSlideId: string;
  text: string | null;
  tags: Record<string, string>;
};

export type ObservedDeck = {
  slides: ObservedSlide[];
  shapes: ObservedShape[];
};

export type ReconcileIssue = {
  code:
    | "missing_start_slide"
    | "missing_divider"
    | "missing_opening_toc"
    | "orphan_generated_slide"
    | "stale_native_hint"
    | "capacity_exceeded"
    | "template_missing";
  message: string;
  sectionId?: string;
  entityId?: string;
};

export type ReconcileResult = {
  config: AgendaConfigV1;
  issues: ReconcileIssue[];
  needsRepair: boolean;
  needsUpdate: boolean;
};

export type UpdatePlanAction =
  | { type: "create_opening_toc" }
  | { type: "create_divider"; sectionId: string }
  | { type: "delete_generated_slide"; entityId: string }
  | { type: "move_slide"; entityId: string; targetIndex: number }
  | { type: "update_slide_content"; entityId: string; sectionId?: string }
  | { type: "repair_native_hints" };

export type AgendaUpdatePlan = {
  actions: UpdatePlanAction[];
  summary: {
    createdDividers: number;
    deletedSlides: number;
    movedSlides: number;
    updatedSlides: number;
    renamedSections: number;
    pageNumberRefreshes: number;
  };
  nextRevision: number;
};

export type AgendaAnalyticsMetadata = {
  sectionCount: number;
  generatedSlideCount: number;
  createdDividers?: number;
  deletedSlides?: number;
  movedSlides?: number;
  updatedSlides?: number;
  renamedSections?: number;
  pageNumberRefreshes?: number;
  repaired?: boolean;
};
