import type { AgendaConfigV1 } from "@deck-pack/agenda";
import { MIN_AGENDA_API_VERSION } from "@deck-pack/agenda";
import { loadAgendaConfig } from "@deck-pack/office-js";
import { CircleNotch, FileText, WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/asset-browser/empty-state";
import { ScreenHeader } from "@/components/asset-browser/screen-header";
import { PowerPointGuard } from "@/components/shell/power-point-guard";

import { AgendaEditor } from "@/components/agenda/editor/agenda-editor";
import type { AgendaPanelView } from "@/components/agenda/types";
import { AgendaSetupWizard } from "@/components/agenda/wizard/agenda-setup-wizard";

function AgendaPanelContent() {
  const [view, setView] = useState<AgendaPanelView>("loading");
  const [config, setConfig] = useState<AgendaConfigV1 | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
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
  }, []);

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

export function AgendaPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        title="Agenda"
        text="Build and maintain a table of contents and section dividers for your presentation."
      />
      <PowerPointGuard powerpointRequired minApi={MIN_AGENDA_API_VERSION}>
        <AgendaPanelContent />
      </PowerPointGuard>
    </div>
  );
}
