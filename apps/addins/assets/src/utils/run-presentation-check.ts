import {
  applyFindingFix,
  loadPresentationIgnoreIds,
  navigateToFinding,
  runPowerPoint,
  scanPresentation,
  type ScanProgress,
} from "@deck-pack/office-js";
import type {
  BrandProfileConfiguration,
  CheckFinding,
  CheckResult,
} from "@deck-pack/presentation-check";
import {
  DEFAULT_BRAND_PROFILE_CONFIGURATION,
  runPresentationCheck,
} from "@deck-pack/presentation-check";

export type ScanScope = "all" | "current" | "selected";

export interface PresentationCheckState {
  progress: ScanProgress | null;
  result: CheckResult | null;
  stale: boolean;
  ignoredFindingIds: Set<string>;
}

export async function runPresentationCheckFlow({
  profile,
  scope,
  onProgress,
  signal,
  presentationIgnoreIds,
}: {
  profile: BrandProfileConfiguration;
  scope: ScanScope;
  onProgress?: (progress: ScanProgress) => void;
  signal?: AbortSignal;
  presentationIgnoreIds?: Set<string>;
}): Promise<CheckResult> {
  const snapshot = await scanPresentation({
    onProgress,
    signal,
    slideIds: scope === "all" ? undefined : await getScopedSlideIds(scope),
  });

  const result = runPresentationCheck(snapshot, profile);

  if (!presentationIgnoreIds || presentationIgnoreIds.size === 0) {
    return result;
  }

  return {
    ...result,
    findings: result.findings.filter((finding) => !presentationIgnoreIds.has(finding.id)),
  };
}

export async function loadStoredPresentationIgnores(): Promise<Set<string>> {
  try {
    return await loadPresentationIgnoreIds();
  } catch {
    return new Set();
  }
}

async function getScopedSlideIds(scope: ScanScope): Promise<string[] | undefined> {
  if (scope === "all") return undefined;

  return runPowerPoint(async (context) => {
    const selected = context.presentation.getSelectedSlides();
    selected.load("items/id");
    await context.sync();

    if (selected.items.length === 0) {
      throw new Error(
        scope === "current"
          ? "No active slide found. Select a slide and try again."
          : "Select one or more slides in the thumbnail pane.",
      );
    }

    if (scope === "current") {
      return [selected.items[0]!.id];
    }

    return selected.items.map((slide) => slide.id);
  });
}

export function filterFindings(
  result: CheckResult,
  ignoredFindingIds: Set<string>,
  severity?: CheckFinding["severity"],
  search?: string,
): CheckFinding[] {
  return result.findings.filter((finding) => {
    if (ignoredFindingIds.has(finding.id)) return false;
    if (severity && finding.severity !== severity) return false;
    if (
      search &&
      !`${finding.message} ${finding.actual} ${finding.expected}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export function getSafeFixableFindings(findings: CheckFinding[]): CheckFinding[] {
  return findings.filter((finding) => finding.suggestedFix?.safe && finding.fixMode !== "none");
}

export async function navigateAndFixFinding(finding: CheckFinding): Promise<void> {
  await navigateToFinding(finding.location);
  if (finding.suggestedFix?.safe) {
    await applyFindingFix(finding);
  }
}

export function getUniversalProfile(): BrandProfileConfiguration {
  return {
    ...DEFAULT_BRAND_PROFILE_CONFIGURATION,
    rules: Object.fromEntries(
      Object.entries(DEFAULT_BRAND_PROFILE_CONFIGURATION.rules).map(([key, rule]) => [
        key,
        {
          ...rule,
          enabled: [
            "text.duplicate-word",
            "text.whitespace",
            "text.empty",
            "geometry.off-slide",
          ].includes(key),
        },
      ]),
    ),
  } as BrandProfileConfiguration;
}
