import type { AgendaConfigV1, AgendaSection, ReconcileIssue } from "@deck-pack/agenda";

export type AgendaPanelView =
  | "loading"
  | "corrupt"
  | "setup"
  | "editor";

export type AgendaEditorStatus =
  | "up_to_date"
  | "changes_pending"
  | "presentation_changed"
  | "repair_required"
  | "template_invalid";

export type AgendaDraftSection = AgendaSection & {
  pageNumber: number | null;
};

export type AgendaChangePreview = {
  createdDividers: number;
  deletedSlides: number;
  movedSlides: number;
  updatedSlides: number;
  renamedSections: number;
  pageNumberRefreshes: number;
};

export type AgendaPanelState = {
  view: AgendaPanelView;
  config: AgendaConfigV1 | null;
  draftSections: AgendaDraftSection[];
  issues: ReconcileIssue[];
  status: AgendaEditorStatus;
  cloudSyncPending: boolean;
  preview: AgendaChangePreview | null;
};
