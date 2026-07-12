import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";
import type { CheckFinding, CheckResult, IssueSeverity } from "@deck-pack/presentation-check";
import { getPowerPointCapabilitySummary, MIN_TEXT_API, navigateToFinding, persistFindingIgnoreForPresentation } from "@deck-pack/office-js";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { PowerPointGuard } from "@/components/power-point-guard";
import { useBrandProfiles } from "@/hooks/use-brand-profiles";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import {
  filterFindings,
  getSafeFixableFindings,
  getUniversalProfile,
  loadStoredPresentationIgnores,
  navigateAndFixFinding,
  runPresentationCheckFlow,
  type ScanScope,
} from "@/lib/run-presentation-check";
import { getPageRouteParams, getPageRouteTo } from "@/lib/navigation";

type CheckView = "setup" | "scanning" | "results" | "detail";
type GroupBy = "none" | "rule" | "slide";
type SeverityFilter = "all" | IssueSeverity;

export function CheckPanel() {
  return <CheckPanelContent />;
}

function CheckGuardedContent({ children }: { children: ReactNode }) {
  return (
    <PowerPointGuard powerpointRequired minApi={MIN_TEXT_API}>
      {children}
    </PowerPointGuard>
  );
}

function CheckPanelContent() {
  const { environment } = useEnvironment();
  const navigate = useNavigate();
  const { profiles, loading } = useBrandProfiles();
  const [view, setView] = useState<CheckView>("setup");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("universal");
  const [scope, setScope] = useState<ScanScope>("all");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [progressText, setProgressText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [stale, setStale] = useState(false);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [scanError, setScanError] = useState<string | null>(null);
  const [presentationIgnores, setPresentationIgnores] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const capabilitySummary = useMemo(() => getPowerPointCapabilitySummary(), []);

  const selectedProfile = useMemo(() => {
    if (selectedProfileId === "universal") return null;
    return profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  }, [profiles, selectedProfileId]);

  const activeConfiguration = useMemo(() => {
    if (selectedProfileId === "universal") return getUniversalProfile();
    return selectedProfile?.configuration ?? getUniversalProfile();
  }, [selectedProfile, selectedProfileId]);

  const visibleFindings = useMemo(() => {
    if (!result) return [];
    const severity = severityFilter === "all" ? undefined : severityFilter;
    const sessionIgnored = new Set([...ignoredIds, ...presentationIgnores]);
    return filterFindings(result, sessionIgnored, severity, search);
  }, [ignoredIds, presentationIgnores, result, search, severityFilter]);

  const groupedFindings = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All issues", findings: visibleFindings }];
    }

    const groups = new Map<string, CheckFinding[]>();
    for (const finding of visibleFindings) {
      const key =
        groupBy === "rule"
          ? finding.ruleId
          : `slide-${finding.location.slideIndex + 1}`;
      const bucket = groups.get(key) ?? [];
      bucket.push(finding);
      groups.set(key, bucket);
    }

    return [...groups.entries()].map(([key, findings]) => ({
      key,
      label: groupBy === "rule" ? key : `Slide ${(findings[0]?.location.slideIndex ?? 0) + 1}`,
      findings,
    }));
  }, [groupBy, visibleFindings]);

  const activeFinding = visibleFindings.find((finding) => finding.id === activeFindingId) ?? null;
  const activeIndex = activeFinding ? visibleFindings.indexOf(activeFinding) : -1;

  const handleScan = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setScanning(true);
    setView("scanning");
    setStale(false);
    setIgnoredIds(new Set());
    setScanError(null);

    try {
      const storedIgnores = await loadStoredPresentationIgnores();
      setPresentationIgnores(storedIgnores);

      const next = await runPresentationCheckFlow({
        profile: activeConfiguration,
        scope,
        signal: controller.signal,
        presentationIgnoreIds: storedIgnores,
        onProgress: (progress) => {
          setProgressText(
            `Slides ${progress.slidesProcessed}/${progress.totalSlides} · Shapes ${progress.shapesProcessed} · ${progress.currentCategory}`,
          );
        },
      });
      setResult(next);
      setView("results");
    } catch (error) {
      if (error instanceof Error && error.message === "Scan cancelled") {
        setView("setup");
        return;
      }
      const rawMessage = error instanceof Error ? error.message : "Scan failed";
      const message = /GeneralException/i.test(rawMessage)
        ? "PowerPoint could not read one or more objects in this presentation. Try scanning the current slide, or remove unsupported objects and rescan."
        : rawMessage;
      setScanError(message);
      toast.error(message);
      setView("setup");
    } finally {
      setScanning(false);
    }
  }, [activeConfiguration, scope]);

  const handleNavigate = useCallback(async (finding: CheckFinding) => {
    try {
      await navigateToFinding(finding.location);
      setActiveFindingId(finding.id);
      setView("detail");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not navigate to issue");
    }
  }, []);

  const handleFix = useCallback(
    async (finding: CheckFinding, applyToAll = false) => {
      const targets = applyToAll
        ? visibleFindings.filter(
            (item) => item.ruleId === finding.ruleId && item.suggestedFix?.safe,
          )
        : [finding];

      try {
        for (const target of targets) {
          await navigateAndFixFinding(target);
        }
        setStale(true);
        toast.success(applyToAll ? "Applied fixes for this rule" : "Issue fixed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Fix failed");
      }
    },
    [visibleFindings],
  );

  const handleSafeFixAll = useCallback(async () => {
    const safeFindings = getSafeFixableFindings(visibleFindings);
    if (safeFindings.length === 0) return;

    try {
      for (const finding of safeFindings) {
        await navigateAndFixFinding(finding);
      }
      setStale(true);
      toast.success(`Applied ${safeFindings.length} safe fixes`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Batch fix failed");
    }
  }, [visibleFindings]);

  if (view === "detail" && activeFinding) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Issue detail" text={activeFinding.message} />
        <CheckGuardedContent>
          <div className="flex flex-col gap-4 px-4 py-4">
          <div className="rounded-xl border p-4 text-sm">
            <p>
              <span className="font-medium">Actual:</span> {activeFinding.actual}
            </p>
            <p className="mt-2">
              <span className="font-medium">Expected:</span> {activeFinding.expected}
            </p>
            <p className="mt-2 text-muted-foreground">
              Slide {activeFinding.location.slideIndex + 1}
              {activeFinding.location.shapeName ? ` · ${activeFinding.location.shapeName}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setView("results")}>
              Back to results
            </Button>
            {activeFinding.suggestedFix?.safe ? (
              <Button type="button" onClick={() => void handleFix(activeFinding)}>
                Apply fix
              </Button>
            ) : null}
            {activeFinding.suggestedFix?.safe ? (
              <Button type="button" variant="outline" onClick={() => void handleFix(activeFinding, true)}>
                Fix all for rule
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIgnoredIds((current) => new Set(current).add(activeFinding.id));
                setView("results");
              }}
            >
              Ignore for session
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void persistFindingIgnoreForPresentation(activeFinding.id, activeFinding.location)
                  .then(() => {
                    setPresentationIgnores((current) => new Set(current).add(activeFinding.id));
                    toast.success("Ignored for this presentation");
                    setView("results");
                  })
                  .catch((error) =>
                    toast.error(error instanceof Error ? error.message : "Could not save ignore"),
                  );
              }}
            >
              Ignore for presentation
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={activeIndex <= 0}
              onClick={() => {
                const previous = visibleFindings[activeIndex - 1];
                if (previous) void handleNavigate(previous);
              }}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Issue {activeIndex + 1} of {visibleFindings.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={activeIndex >= visibleFindings.length - 1}
              onClick={() => {
                const next = visibleFindings[activeIndex + 1];
                if (next) void handleNavigate(next);
              }}
            >
              Next
            </Button>
          </div>
          </div>
        </CheckGuardedContent>
      </div>
    );
  }

  if (view === "scanning") {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader
          title="Presentation Check"
          text="Scanning the open presentation against your selected theme."
        />
        <CheckGuardedContent>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8">
        <CircleNotch className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium">Scanning presentation...</p>
        <p className="text-xs text-muted-foreground">{progressText}</p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            abortRef.current?.abort();
            setScanning(false);
            setView("setup");
          }}
        >
          Cancel
        </Button>
          </div>
        </CheckGuardedContent>
      </div>
    );
  }

  if (view === "results" && result) {
    const safeCount = getSafeFixableFindings(visibleFindings).length;

    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader
          title="Check results"
          text={`${result.summary.errors} errors · ${result.summary.warnings} warnings · ${result.summary.suggestions} suggestions`}
        />
        <CheckGuardedContent>
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
            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as SeverityFilter)}>
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
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
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

          <Input
            placeholder="Search issues"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {safeCount > 0 ? (
            <Button type="button" onClick={() => void handleSafeFixAll()}>
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
                    onClick={() => void handleNavigate(finding)}
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
            onClick={() => void handleScan()}
          />
          <Button type="button" variant="ghost" onClick={() => setView("setup")}>
            Back to setup
          </Button>
          </div>
        </CheckGuardedContent>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Presentation Check"
        text="Scan the open presentation against a theme and review fixable issues."
      />

      <CheckGuardedContent>
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

        {capabilitySummary.highest ? (
          <p className="text-xs text-muted-foreground">
            PowerPoint API support: {capabilitySummary.supported.join(", ")}
          </p>
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
            onValueChange={(value) => value && setSelectedProfileId(value)}
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
            <Button
              type="button"
              variant="ghost"
              className="justify-start px-0"
              onClick={() =>
                navigate({
                  to: getPageRouteTo("themes"),
                  params: getPageRouteParams(environment),
                })
              }
            >
              Edit selected theme
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Scope</label>
          <Select value={scope} onValueChange={(value) => setScope(value as ScanScope)}>
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
          {loading
            ? "Loading themes..."
            : `${Object.values(activeConfiguration.rules).filter((rule) => rule.enabled).length} rules enabled`}
        </p>

        <InsertSection
          disabled={scanning}
          isInserting={scanning}
          label="Scan presentation"
          insertingLabel="Scanning..."
          onClick={() => void handleScan()}
        />
        </div>
      </CheckGuardedContent>
    </div>
  );
}
