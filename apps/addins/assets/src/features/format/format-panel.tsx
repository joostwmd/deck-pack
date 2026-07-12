import type { FormattingActionId, GapParams, SetBoundsParams } from "@deck-pack/presentation-formatting";
import { MIN_TEXT_API } from "@deck-pack/office-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@deck-pack/ui/components/system/tabs";
import { Table } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { PowerPointGuard } from "@/components/power-point-guard";
import { usePowerPointSelection } from "@/hooks/use-powerpoint-selection";
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

function FormatSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function FormatPanelContent() {
  const { selection, applicableCommands, refresh, isRefreshing, state } = usePowerPointSelection();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 pt-2">
      <SelectionSummary selection={selection} isRefreshing={isRefreshing} onRefresh={() => void refresh()} />

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
            <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
              <BoundsControls
                selection={selection}
                busy={busyActionId === "set-bounds"}
                onApply={(values) => void runAction("set-bounds", values)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Align">
            <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
              <AlignControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Distribute">
            <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
              <DistributeControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Size">
            <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
              <SizeControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Distribute & space">
            <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
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
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="More">
            <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
              <MoreControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
            <TextControls
              applicabilityById={applicabilityById}
              busyActionId={busyActionId}
              onAction={(id) => void runAction(id)}
            />
          </PowerPointGuard>
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
  );
}

export function FormatPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        title="Format"
        text="Select objects on the slide, then apply layout and spacing tools from this pane."
      />

      <PowerPointGuard powerpointRequired>
        <FormatPanelContent />
      </PowerPointGuard>
    </div>
  );
}
