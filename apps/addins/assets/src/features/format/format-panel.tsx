import type { FormattingActionId, GapParams, SetBoundsParams } from "@deck-pack/presentation-formatting";
import { getPowerPointCapabilitySummary } from "@deck-pack/office-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@deck-pack/ui/components/system/tabs";
import { Palette, Table } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { usePowerPointSelection } from "@/hooks/use-powerpoint-selection";
import type { AssetPanelMode } from "@/lib/asset-types";
import { runFormattingCommand } from "@/lib/run-formatting-command";

import {
  AlignControls,
  DistributeControls,
  MoreControls,
  SizeControls,
  SpacingControls,
} from "./align-controls";
import { BoundsControls, SelectionSummary } from "./bounds-controls";
import { GapExactControls } from "./gap-controls";
import { TextControls } from "./text-controls";

interface FormatPanelProps {
  mode: AssetPanelMode;
}

function FormatSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

export function FormatPanel({ mode }: FormatPanelProps) {
  const { selection, applicableCommands, refresh, isRefreshing, state } = usePowerPointSelection(mode);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const capabilitySummary = useMemo(
    () => (mode === "office" ? getPowerPointCapabilitySummary() : null),
    [mode],
  );

  const applicabilityById = useMemo(
    () => new Map(applicableCommands.map((entry) => [entry.id, entry.applicability])),
    [applicableCommands],
  );

  const runAction = async (commandId: FormattingActionId, params?: GapParams | SetBoundsParams) => {
    setBusyActionId(commandId);

    try {
      const result = await runFormattingCommand(commandId, params);
      if (!result.ok) {
        toast.error(result.reason);
        return;
      }

      toast.success(
        result.mutationCount > 0
          ? `Applied ${commandId.replaceAll("-", " ")} to ${result.mutationCount} object${result.mutationCount === 1 ? "" : "s"}.`
          : "Selection already matched the requested formatting.",
      );
      await refresh();
    } finally {
      setBusyActionId(null);
    }
  };

  if (mode !== "office") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ScreenHeader
          title="Format"
          text="Open this add-in inside PowerPoint to use selection-based formatting tools."
        />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <EmptyState
            icon={Palette}
            title="Office required"
            description="Formatting tools are available in the PowerPoint task pane."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        title="Format"
        text="Select objects on the slide, then apply layout and spacing tools from this pane."
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 pt-2">
        <SelectionSummary selection={selection} isRefreshing={isRefreshing} onRefresh={() => void refresh()} />

        {capabilitySummary && !capabilitySummary.baselineMet ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            Some formatting features require a newer PowerPoint build. Supported API levels:{" "}
            {capabilitySummary.supported.join(", ") || "none detected"}.
          </p>
        ) : null}

        {state.status === "error" ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {state.message}
          </p>
        ) : null}

        <Tabs defaultValue="shapes" className="min-h-0 flex-1">
          <TabsList className="w-full">
            <TabsTrigger value="shapes" className="flex-1">
              Shapes
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1">
              Text
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex-1" disabled>
              Tables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shapes" className="mt-4 grid gap-4">
            <FormatSection title="Position & size">
              <BoundsControls
                selection={selection}
                busy={busyActionId === "set-bounds"}
                onApply={(values) => void runAction("set-bounds", values)}
              />
            </FormatSection>

            <FormatSection title="Align">
              <AlignControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </FormatSection>

            <FormatSection title="Distribute">
              <DistributeControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </FormatSection>

            <FormatSection title="Size">
              <SizeControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </FormatSection>

            <FormatSection title="Distribute & space">
              <SpacingControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
              <GapExactControls
                disabled={!selection || selection.shapes.length < 2}
                busy={busyActionId === "gap-exact-horizontal" || busyActionId === "gap-exact-vertical"}
                onApplyHorizontal={(value) =>
                  void runAction("gap-exact-horizontal", { mode: "exact", direction: "horizontal", value })
                }
                onApplyVertical={(value) =>
                  void runAction("gap-exact-vertical", { mode: "exact", direction: "vertical", value })
                }
              />
            </FormatSection>

            <FormatSection title="More">
              <MoreControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </FormatSection>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <TextControls
              applicabilityById={applicabilityById}
              busyActionId={busyActionId}
              onAction={(id) => void runAction(id)}
            />
          </TabsContent>

          <TabsContent value="tables" className="mt-4">
            <EmptyState
              icon={Table}
              title="Tables coming soon"
              description="Table formatting tools will appear here in a future update."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
