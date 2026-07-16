import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";
import type { CheckFinding } from "@deck-pack/presentation-check";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { PowerPointGuard, type PowerPointApiLevel } from "@/components/power-point-guard";
import type { ScanScope } from "@/lib/run-presentation-check";

import type { CheckPanelController, GroupBy, SeverityFilter } from "./use-check-panel-controller";

export interface CheckPanelProfileOption {
  id: string;
  name: string;
}

export interface CheckPanelViewProps {
  minTextApi: PowerPointApiLevel;
  capabilitySummaryText: string | null;
  controller: CheckPanelController;
}

function CheckGuardedContent({
  minTextApi,
  children,
}: {
  minTextApi: PowerPointApiLevel;
  children: ReactNode;
}) {
  return (
    <PowerPointGuard powerpointRequired minApi={minTextApi}>
      {children}
    </PowerPointGuard>
  );
}

export function CheckPanelView({ minTextApi, capabilitySummaryText, controller }: CheckPanelViewProps) {
  const {
    view,
    setView,
    selectedProfileId,
    setSelectedProfileId,
    scope,
    setScope,
    result,
    progressText,
    scanning,
    stale,
    search,
    setSearch,
    severityFilter,
    setSeverityFilter,
    groupBy,
    setGroupBy,
    scanError,
    profiles,
    loading,
    visibleFindings,
    groupedFindings,
    activeFinding,
    activeIndex,
    enabledRuleCount,
    safeCount,
    handleScan,
    handleNavigate,
    handleFix,
    handleSafeFixAll,
    handleCancelScan,
    handleIgnoreForSession,
    handleIgnoreForPresentation,
    handleEditTheme,
    insertSectionShortcutDefs,
  } = controller;

  if (view === "detail" && activeFinding) {
    return (
      <CheckDetailView
        minTextApi={minTextApi}
        finding={activeFinding}
        activeIndex={activeIndex}
        totalFindings={visibleFindings.length}
        onBackToResults={() => setView("results")}
        onFix={(applyToAll) => void handleFix(activeFinding, applyToAll)}
        onIgnoreForSession={() => handleIgnoreForSession(activeFinding.id)}
        onIgnoreForPresentation={() => void handleIgnoreForPresentation(activeFinding)}
        onPrevious={() => {
          const previous = visibleFindings[activeIndex - 1];
          if (previous) void handleNavigate(previous);
        }}
        onNext={() => {
          const next = visibleFindings[activeIndex + 1];
          if (next) void handleNavigate(next);
        }}
      />
    );
  }

  if (view === "scanning") {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader
          title="Presentation Check"
          text="Scanning the open presentation against your selected theme."
        />
        <CheckGuardedContent minTextApi={minTextApi}>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8">
            <CircleNotch className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium">Scanning presentation...</p>
            <p className="text-xs text-muted-foreground">{progressText}</p>
            <Button type="button" variant="ghost" onClick={handleCancelScan}>
              Cancel
            </Button>
          </div>
        </CheckGuardedContent>
      </div>
    );
  }

  if (view === "results" && result) {
    return (
      <CheckResultsView
        minTextApi={minTextApi}
        result={result}
        stale={stale}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        search={search}
        onSearchChange={setSearch}
        safeCount={safeCount}
        visibleFindings={visibleFindings}
        groupedFindings={groupedFindings}
        scanning={scanning}
        onSafeFixAll={() => void handleSafeFixAll()}
        onNavigateFinding={(finding) => void handleNavigate(finding)}
        onRescan={() => void handleScan()}
        onBackToSetup={() => setView("setup")}
        insertSectionShortcutDefs={insertSectionShortcutDefs}
      />
    );
  }

  return (
    <CheckSetupView
      minTextApi={minTextApi}
      scanError={scanError}
      capabilitySummaryText={capabilitySummaryText}
      profiles={profiles}
      loading={loading}
      selectedProfileId={selectedProfileId}
      onSelectedProfileIdChange={setSelectedProfileId}
      scope={scope}
      onScopeChange={setScope}
      enabledRuleCount={enabledRuleCount}
      scanning={scanning}
      onScan={() => void handleScan()}
      onEditTheme={handleEditTheme}
      insertSectionShortcutDefs={insertSectionShortcutDefs}
    />
  );
}

function CheckSetupView({
  minTextApi,
  scanError,
  capabilitySummaryText,
  profiles,
  loading,
  selectedProfileId,
  onSelectedProfileIdChange,
  scope,
  onScopeChange,
  enabledRuleCount,
  scanning,
  onScan,
  onEditTheme,
  insertSectionShortcutDefs,
}: {
  minTextApi: PowerPointApiLevel;
  scanError: string | null;
  capabilitySummaryText: string | null;
  profiles: CheckPanelProfileOption[];
  loading: boolean;
  selectedProfileId: string;
  onSelectedProfileIdChange: (value: string) => void;
  scope: ScanScope;
  onScopeChange: (value: ScanScope) => void;
  enabledRuleCount: number;
  scanning: boolean;
  onScan: () => void;
  onEditTheme: () => void;
  insertSectionShortcutDefs: CheckPanelController["insertSectionShortcutDefs"];
}) {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Presentation Check"
        text="Scan the open presentation against a theme and review fixable issues."
      />

      <CheckGuardedContent minTextApi={minTextApi}>
        <div className="flex flex-col gap-4 px-4 py-4">
          {scanError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <WarningCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{scanError}</p>
            </div>
          ) : null}

          {capabilitySummaryText ? (
            <p className="text-xs text-muted-foreground">{capabilitySummaryText}</p>
          ) : null}

          {!loading && profiles.length === 0 && selectedProfileId !== "universal" ? (
            <p className="text-xs text-muted-foreground">
              No saved themes yet. Universal checks are still available, or create a theme first.
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Theme</label>
            <Select
              value={selectedProfileId}
              onValueChange={(value) => value && onSelectedProfileIdChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="universal">Universal checks only</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProfileId !== "universal" ? (
              <Button type="button" variant="ghost" className="justify-start px-0" onClick={onEditTheme}>
                Edit selected theme
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Scope</label>
            <Select value={scope} onValueChange={(value) => onScopeChange(value as ScanScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Entire presentation</SelectItem>
                <SelectItem value="current">Current slide</SelectItem>
                <SelectItem value="selected">Selected slides</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {loading ? "Loading themes..." : `${enabledRuleCount} rules enabled`}
          </p>

          <InsertSection
            disabled={scanning}
            isInserting={scanning}
            label="Scan presentation"
            insertingLabel="Scanning..."
            shortcutDefs={insertSectionShortcutDefs}
            onClick={onScan}
          />
        </div>
      </CheckGuardedContent>
    </div>
  );
}

function CheckResultsView({
  minTextApi,
  result,
  stale,
  severityFilter,
  onSeverityFilterChange,
  groupBy,
  onGroupByChange,
  search,
  onSearchChange,
  safeCount,
  visibleFindings,
  groupedFindings,
  scanning,
  onSafeFixAll,
  onNavigateFinding,
  onRescan,
  onBackToSetup,
  insertSectionShortcutDefs,
}: {
  minTextApi: PowerPointApiLevel;
  result: NonNullable<CheckPanelController["result"]>;
  stale: boolean;
  severityFilter: SeverityFilter;
  onSeverityFilterChange: (value: SeverityFilter) => void;
  groupBy: GroupBy;
  onGroupByChange: (value: GroupBy) => void;
  search: string;
  onSearchChange: (value: string) => void;
  safeCount: number;
  visibleFindings: CheckFinding[];
  groupedFindings: { key: string; label: string; findings: CheckFinding[] }[];
  scanning: boolean;
  onSafeFixAll: () => void;
  onNavigateFinding: (finding: CheckFinding) => void;
  onRescan: () => void;
  onBackToSetup: () => void;
  insertSectionShortcutDefs: CheckPanelController["insertSectionShortcutDefs"];
}) {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Check results"
        text={`${result.summary.errors} errors · ${result.summary.warnings} warnings · ${result.summary.suggestions} suggestions`}
      />
      <CheckGuardedContent minTextApi={minTextApi}>
        <div className="flex flex-col gap-4 px-4 py-4">
          {stale ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              The presentation may have changed since this scan. Rescan to verify the results.
            </p>
          ) : null}

          {result.summary.unsupportedRules.length > 0 ? (
            <p className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-900 dark:text-blue-100">
              {result.summary.unsupportedRules.length} enabled rule
              {result.summary.unsupportedRules.length === 1 ? "" : "s"} require a newer PowerPoint API:{" "}
              {result.summary.unsupportedRules.join(", ")}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={severityFilter}
              onValueChange={(value) => onSeverityFilterChange(value as SeverityFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Suggestions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as GroupBy)}>
              <SelectTrigger>
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="rule">Group by rule</SelectItem>
                <SelectItem value="slide">Group by slide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input placeholder="Search issues" value={search} onChange={(event) => onSearchChange(event.target.value)} />

          {safeCount > 0 ? (
            <Button type="button" onClick={onSafeFixAll}>
              Fix {safeCount} safe issues
            </Button>
          ) : null}

          {visibleFindings.length === 0 ? (
            <EmptyState
              icon={WarningCircle}
              title="No issues found"
              description="This presentation passed the selected rules."
            />
          ) : (
            groupedFindings.map((group) => (
              <div key={group.key} className="flex flex-col gap-2">
                {groupBy !== "none" ? (
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {group.label} · {group.findings.length}
                  </p>
                ) : null}
                {group.findings.map((finding) => (
                  <button
                    key={finding.id}
                    type="button"
                    className="rounded-xl border p-4 text-left transition-colors hover:bg-accent/40"
                    onClick={() => onNavigateFinding(finding)}
                  >
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {finding.severity} · {finding.category}
                    </p>
                    <p className="mt-1 font-medium">{finding.message}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Slide {finding.location.slideIndex + 1}
                      {finding.location.shapeName ? ` · ${finding.location.shapeName}` : ""}
                    </p>
                    <p className="mt-2 text-sm">
                      {finding.actual} → {finding.expected}
                    </p>
                  </button>
                ))}
              </div>
            ))
          )}

          <InsertSection
            disabled={scanning}
            isInserting={scanning}
            label="Rescan presentation"
            insertingLabel="Scanning..."
            shortcutDefs={insertSectionShortcutDefs}
            onClick={onRescan}
          />
          <Button type="button" variant="ghost" onClick={onBackToSetup}>
            Back to setup
          </Button>
        </div>
      </CheckGuardedContent>
    </div>
  );
}

function CheckDetailView({
  minTextApi,
  finding,
  activeIndex,
  totalFindings,
  onBackToResults,
  onFix,
  onIgnoreForSession,
  onIgnoreForPresentation,
  onPrevious,
  onNext,
}: {
  minTextApi: PowerPointApiLevel;
  finding: CheckFinding;
  activeIndex: number;
  totalFindings: number;
  onBackToResults: () => void;
  onFix: (applyToAll: boolean) => void;
  onIgnoreForSession: () => void;
  onIgnoreForPresentation: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Issue detail" text={finding.message} />
      <CheckGuardedContent minTextApi={minTextApi}>
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="rounded-xl border p-4 text-sm">
            <p>
              <span className="font-medium">Actual:</span> {finding.actual}
            </p>
            <p className="mt-2">
              <span className="font-medium">Expected:</span> {finding.expected}
            </p>
            <p className="mt-2 text-muted-foreground">
              Slide {finding.location.slideIndex + 1}
              {finding.location.shapeName ? ` · ${finding.location.shapeName}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBackToResults}>
              Back to results
            </Button>
            {finding.suggestedFix?.safe ? (
              <Button type="button" onClick={() => onFix(false)}>
                Apply fix
              </Button>
            ) : null}
            {finding.suggestedFix?.safe ? (
              <Button type="button" variant="outline" onClick={() => onFix(true)}>
                Fix all for rule
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={onIgnoreForSession}>
              Ignore for session
            </Button>
            <Button type="button" variant="ghost" onClick={onIgnoreForPresentation}>
              Ignore for presentation
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" disabled={activeIndex <= 0} onClick={onPrevious}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Issue {activeIndex + 1} of {totalFindings}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={activeIndex >= totalFindings - 1}
              onClick={onNext}
            >
              Next
            </Button>
          </div>
        </div>
      </CheckGuardedContent>
    </div>
  );
}
