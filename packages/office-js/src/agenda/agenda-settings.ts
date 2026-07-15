import {
  AGENDA_SETTINGS_KEY,
  type AgendaConfigV1,
  safeParseAgendaConfig,
} from "@deck-pack/agenda";

import {
  loadDocumentSetting,
  removeDocumentSetting,
  saveDocumentSetting,
} from "../settings/document-settings";

export type AgendaSettingsState =
  | { status: "not_configured" }
  | { status: "configured"; config: AgendaConfigV1 }
  | { status: "corrupt"; error: string };

export async function loadAgendaConfig(): Promise<AgendaSettingsState> {
  const raw = await loadDocumentSetting<unknown>(AGENDA_SETTINGS_KEY);
  if (raw == null) {
    return { status: "not_configured" };
  }

  const parsed = safeParseAgendaConfig(raw);
  if (!parsed.success) {
    return {
      status: "corrupt",
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  return { status: "configured", config: parsed.data };
}

export async function persistAgendaConfig(config: AgendaConfigV1): Promise<void> {
  await saveDocumentSetting(AGENDA_SETTINGS_KEY, config);
}

export async function clearAgendaConfig(): Promise<void> {
  await removeDocumentSetting(AGENDA_SETTINGS_KEY);
}
