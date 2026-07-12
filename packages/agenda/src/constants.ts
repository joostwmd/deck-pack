export const AGENDA_SCHEMA_VERSION = 1 as const;

export const AGENDA_SETTINGS_KEY = "deck-pack.agenda.config";

export const DECKPACK_TAG_KEYS = {
  AGENDA_ID: "DECKPACK_AGENDA_ID",
  ENTITY_ID: "DECKPACK_ENTITY_ID",
  AGENDA_ROLE: "DECKPACK_AGENDA_ROLE",
  SECTION_ID: "DECKPACK_SECTION_ID",
  SLOT_ID: "DECKPACK_SLOT_ID",
  FIELD_ROLE: "DECKPACK_FIELD_ROLE",
} as const;

export const AGENDA_ROLES = {
  OPENING_TOC: "opening_toc",
  SECTION_DIVIDER: "section_divider",
  SECTION_START: "section_start",
  TEMPLATE: "template",
} as const;

export const FIELD_ROLES = {
  HEADING: "heading",
  SECTION_NUMBER: "section_number",
  SECTION_TITLE: "section_title",
  PAGE_NUMBER: "page_number",
} as const;

export const AGENDA_EVENT_TYPES = ["created", "updated", "repaired", "deleted"] as const;

export const MIN_AGENDA_API_VERSION = "1.8" as const;
