import type { AgendaConfigV1 } from "@deck-pack/agenda";
import { MIN_AGENDA_API_VERSION } from "@deck-pack/agenda";
import {
  getPowerPointCapabilitySummary,
  isPowerPointApiAvailable,
  loadAgendaConfig,
} from "@deck-pack/office-js";
import { CircleNotch, FileText, WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/asset-picker/empty-state";
import type { AssetPanelMode } from "@/lib/asset-types";

import { AgendaEditor } from "./editor/agenda-editor";
import type { AgendaPanelView } from "./types";
import { AgendaSetupWizard } from "./wizard/agenda-setup-wizard";

interface AgendaPanelProps {
  mode: AssetPanelMode;
}

export function AgendaPanel({ mode }: AgendaPanelProps) {
  const [view, setView] = useState<AgendaPanelView>("loading");
  const [config, setConfig] = useState<AgendaConfigV1 | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (mode !== "office") {
      setView("unsupported");
      return;
    }

    if (!isPowerPointApiAvailable(MIN_AGENDA_API_VERSION)) {
      setView("unsupported");
      return;
    }

    const capabilities = getPowerPointCapabilitySummary();
    if (!capabilities.baselineMet) {
      setView("unsupported");
      return;
    }

    const state = await loadAgendaConfig();
    if (state.status === "not_configured") {
      setConfig(null);
      setView("setup");
      return;
    }
    if (state.status === "corrupt") {
      setConfig(null);
      setView("corrupt");
      return;
    }

    setConfig(state.config);
    setView("editor");
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  if (view === "loading") {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <CircleNotch className="size-4 animate-spin" />
        Loading agenda...
      </div>
    );
  }

  if (view === "unsupported") {
    return (
      <EmptyState
        icon={WarningCircle}
        title="Agenda requires PowerPoint"
        description="Open this add-in inside PowerPoint with API 1.8 or later to build and maintain agendas."
      />
    );
  }

  if (view === "corrupt") {
    return (
      <div className="space-y-4 p-4">
        <EmptyState
          icon={WarningCircle}
          title="Agenda configuration is corrupt"
          description="The saved agenda settings in this presentation could not be parsed. Re-run setup to recreate the agenda."
        />
        <button
          type="button"
          className="w-full rounded-md border px-3 py-2 text-sm"
          onClick={() => setView("setup")}
        >
          Set up again
        </button>
      </div>
    );
  }

  if (view === "setup") {
    return (
      <AgendaSetupWizard
        onComplete={() => {
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  if (!config) {
    return (
      <EmptyState
        icon={FileText}
        title="Agenda not configured"
        description="Set up your agenda to generate table of contents and section dividers."
      />
    );
  }

  return (
    <AgendaEditor
      key={`${config.agendaId}-${config.revision}-${reloadKey}`}
      initialConfig={config}
      onConfigChange={setConfig}
    />
  );
}
