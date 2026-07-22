import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { CheckFinding, CheckResult, IssueSeverity } from "@deck-pack/brand-compliance";
import { navigateToFinding, persistFindingIgnoreForPresentation } from "@deck-pack/office-js";

import { useBrandProfiles } from "@/hooks/shared/use-brand-profiles";
import { useInsertSectionShortcutDefs } from "@/hooks/shortcuts/use-resolved-shortcut-defs";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import {
  filterFindings,
  getSafeFixableFindings,
  getUniversalProfile,
  loadStoredPresentationIgnores,
  navigateAndFixFinding,
  runPresentationCheckFlow,
  type ScanScope,
} from "@/utils/run-presentation-check";
import { getPageRouteParams, getPageRouteTo } from "@/constants/navigation";

export type CheckView = "setup" | "scanning" | "results" | "detail";
export type GroupBy = "none" | "rule" | "slide";
export type SeverityFilter = "all" | IssueSeverity;

export function useCheckPanelController() {
  const { environment } = useEnvironment();
  const navigate = useNavigate();
  const { profiles, loading } = useBrandProfiles();
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();
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
      const key = groupBy === "rule" ? finding.ruleId : `slide-${finding.location.slideIndex + 1}`;
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

  const handleCancelScan = useCallback(() => {
    abortRef.current?.abort();
    setScanning(false);
    setView("setup");
  }, []);

  const handleIgnoreForSession = useCallback((findingId: string) => {
    setIgnoredIds((current) => new Set(current).add(findingId));
    setView("results");
  }, []);

  const handleIgnoreForPresentation = useCallback(async (finding: CheckFinding) => {
    try {
      await persistFindingIgnoreForPresentation(finding.id, finding.location);
      setPresentationIgnores((current) => new Set(current).add(finding.id));
      toast.success("Ignored for this presentation");
      setView("results");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save ignore");
    }
  }, []);

  const handleEditTheme = useCallback(() => {
    navigate({
      to: getPageRouteTo("themes"),
      params: getPageRouteParams(environment),
    });
  }, [environment, navigate]);

  const enabledRuleCount = Object.values(activeConfiguration.rules).filter(
    (rule) => rule.enabled,
  ).length;
  const safeCount = getSafeFixableFindings(visibleFindings).length;

  return {
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
  };
}

export type CheckPanelController = ReturnType<typeof useCheckPanelController>;
