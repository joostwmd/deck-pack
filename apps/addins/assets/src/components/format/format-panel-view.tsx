import type { FormattingActionId, GapParams, SetBoundsParams } from "@deck-pack/presentation-formatting";
import type { ShapeSelection } from "@deck-pack/presentation-formatting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@deck-pack/ui/components/system/tabs";
import { Table } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/asset-browser/empty-state";
import { ScreenHeader } from "@/components/asset-browser/screen-header";
import { PowerPointGuard, type PowerPointApiLevel } from "@/components/shell/power-point-guard";
import type { SelectionState } from "@/hooks/use-powerpoint-selection";

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
import type { FormatPanelController } from "@/hooks/use-format-panel-controller";

function FormatSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

export interface FormatPanelViewProps {
  minTextApi: PowerPointApiLevel;
  controller: FormatPanelController;
}

function FormatPanelContentView({
  minTextApi,
  selection,
  applicabilityById,
  busyActionId,
  isRefreshing,
  state,
  refresh,
  runAction,
}: {
  minTextApi: PowerPointApiLevel;
  selection: ShapeSelection | null;
  applicabilityById: FormatPanelController["applicabilityById"];
  busyActionId: string | null;
  isRefreshing: boolean;
  state: SelectionState;
  refresh: () => Promise<void>;
  runAction: (commandId: FormattingActionId, params?: GapParams | SetBoundsParams) => Promise<void>;
}) {
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
            <PowerPointGuard powerpointRequired minApi={minTextApi}>
              <BoundsControls
                selection={selection}
                busy={busyActionId === "set-bounds"}
                onApply={(values) => void runAction("set-bounds", values)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Align">
            <PowerPointGuard powerpointRequired minApi={minTextApi}>
              <AlignControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Distribute">
            <PowerPointGuard powerpointRequired minApi={minTextApi}>
              <DistributeControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Size">
            <PowerPointGuard powerpointRequired minApi={minTextApi}>
              <SizeControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>

          <FormatSection title="Distribute & space">
            <PowerPointGuard powerpointRequired minApi={minTextApi}>
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
            <PowerPointGuard powerpointRequired minApi={minTextApi}>
              <MoreControls
                applicabilityById={applicabilityById}
                busyActionId={busyActionId}
                onAction={(id) => void runAction(id)}
              />
            </PowerPointGuard>
          </FormatSection>
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <PowerPointGuard powerpointRequired minApi={minTextApi}>
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

export function FormatPanelView({ minTextApi, controller }: FormatPanelViewProps) {
  const { selection, applicabilityById, busyActionId, isRefreshing, state, refresh, runAction } =
    controller;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        title="Format"
        text="Select objects on the slide, then apply layout and spacing tools from this pane."
      />

      <PowerPointGuard powerpointRequired>
        <FormatPanelContentView
          minTextApi={minTextApi}
          selection={selection}
          applicabilityById={applicabilityById}
          busyActionId={busyActionId}
          isRefreshing={isRefreshing}
          state={state}
          refresh={refresh}
          runAction={runAction}
        />
      </PowerPointGuard>
    </div>
  );
}
