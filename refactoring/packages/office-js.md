# `packages/office-js` — adapter package, capability-oriented

Kind: **adapter**, single-target-many-capabilities shape (per `00-conventions-and-architecture.md` §8.1 — one external system, Office.js/PowerPoint, exposed through many distinct capability folders, rather than one port with one implementation). Structurally this package is already close to correct; the one real change is `fixes/apply-finding-fix.ts`'s `switch` statement.

**Decision (00-conventions §8.4): this stays one package, not split per domain.** It's the _only_ package in the repo with a real Office.js dependency — `agenda`, `presentation-check`/`brand-compliance`, and `presentation-formatting`/`shape-commands` are all pure and are dependencies _of_ this package, not the reverse (confirmed via `package.json`). Domain footprint is asymmetric (`agenda`/`shape-commands`/`brand-compliance` each have real Office.js-specific glue here; `shortcuts` has none at all — its keybinding capture is DOM-only, in `apps/addins`), which is exactly why one unified adapter with a capability subfolder per domain that needs one beats three-to-four inconsistently-sized sibling packages.

## Current state (confirmed)

```
packages/office-js/src/
  client.ts                       — OfficeClient class (insertImage, detect(), isAvailable, isLoaded, ...)
  utils.ts                         — runPowerPoint, runOfficeAsync, detectOffice, isOfficeReady, ...
  types.ts
  agenda/          (scan-agenda-deck.ts, apply-agenda-update.ts, agenda-tags.ts, agenda-selection.ts, agenda-settings.ts)
  capabilities/     (get-capability-summary.ts)
  capture/           (capture-selection-style.ts)
  constants/          (requirement-sets.ts)
  extract/             (extract-theme-draft.ts)
  fixes/                (apply-finding-fix.ts)
  format/                (text-frame-mappers.ts, formatting-errors.ts, apply-shape-mutations.ts, execute-formatting-command.ts)
  ignores/                (presentation-ignores.ts)
  navigation/              (navigate-to-finding.ts)
  selection/                (read-selected-shapes.ts, subscribe-selection-changes.ts, read-selected-shapes-api.ts, shape-capabilities.ts)
  settings/                  (document-settings.ts)
  snapshot/                   (scan-presentation.ts)
  test-utils/                   (fake-powerpoint-context.ts)
  index.ts
```

`client.ts` (confirmed, excerpt) — `OfficeClient` is the existing OOP precedent this whole package already follows:

```typescript
export class OfficeClient {
  private detectedAvailability: boolean | null = null;

  async detect(): Promise<boolean> {
    this.detectedAvailability = await detectOffice();
    return this.detectedAvailability;
  }
  get isAvailable(): boolean {
    return this.detectedAvailability ?? isOfficeDocumentAvailable();
  }
  get isLoaded(): boolean {
    return isOfficeReady();
  }

  async insertImage(base64: string, options: InsertImageOptions = {}): Promise<void> {
    return runOfficeAsync(
      (Office) =>
        new Promise((resolve, reject) => {
          /* ... */
        }),
    );
  }
  // ... insertSlides, other Office.js document operations
}
```

`selection/subscribe-selection-changes.ts` (confirmed) — a named port (`OfficeContextPort`/`OfficeDocumentPort`) already following the Port convention, used to make Office.js's callback-based `addHandlerAsync` testable without a real Office runtime:

```typescript
export type OfficeDocumentPort = {
  addHandlerAsync: (
    eventType: string,
    handler: SelectionChangeHandler,
    callback?: (result: { status: string; error?: { message?: string } }) => void,
  ) => void;
  removeHandlerAsync: (
    eventType: string,
    options: { handler: SelectionChangeHandler },
    callback?: (result: { status: string; error?: { message?: string } }) => void,
  ) => void;
};
export type OfficeContextPort = { document: OfficeDocumentPort };
```

`format/execute-formatting-command.ts` (confirmed, in full) — the adapter that takes a `shape-commands` `FormattingCommand` and actually runs it against a live PowerPoint context, already a clean Command-executor:

```typescript
export async function executeFormattingCommand(
  run: <T>(callback: (context: PowerPoint.RequestContext) => Promise<T>) => Promise<T>,
  command: AnyFormattingCommand,
  params: unknown,
): Promise<FormattingExecutionResult> {
  return run(async (context) => {
    const selection = await readSelectedShapesFromContext(context);
    const applicability = command.evaluate(selection, params);
    if (!applicability.applicable)
      throw new FormattingUnavailableError(applicability.code, applicability.reason);
    const plan = command.createPlan(selection, params);
    const selectedIds = new Set(selection.shapes.map((shape) => shape.id));
    await applyShapeMutationsInContext(context, selectedIds, plan);
    return { commandId: command.id, mutationCount: plan.length };
  });
}
```

## The one required change — `fixes/apply-finding-fix.ts`

Current code (confirmed, in full) — the `switch` statement flagged throughout this refactor discussion:

```typescript
export async function applyFindingFix(finding: CheckFinding): Promise<void> {
  if (!finding.suggestedFix || !finding.location.shapeId)
    throw new Error("This issue cannot be fixed automatically.");
  const { slideId, shapeId, textStart, textLength } = finding.location;
  const fix = finding.suggestedFix;

  return runPowerPoint(async (context) => {
    const slide = context.presentation.slides.getItem(slideId);
    const shape = slide.shapes.getItem(shapeId!);
    const textFrame = shape.textFrame;

    switch (fix.type) {
      case "set-font-name": {
        const range = getTargetRange(textFrame, textStart, textLength);
        range.font.name = String(fix.payload.fontName);
        break;
      }
      case "set-font-color": {
        const range = getTargetRange(textFrame, textStart, textLength);
        range.font.color = String(fix.payload.color);
        break;
      }
      case "replace-text-range": {
        const range = getTargetRange(textFrame, textStart, textLength);
        range.text = String(fix.payload.replacement);
        break;
      }
      case "normalize-whitespace":
      case "trim-text": {
        /* load/sync/rewrite textFrame.textRange.text */ break;
      }
      default:
        throw new Error(`Unsupported fix type: ${fix.type}`);
    }
    await context.sync();
  });
}
```

Target code — delegates to `brand-compliance`'s new `textFixRegistry` (see `packages/brand-compliance.md`) instead of switching:

```typescript
import { getTextFixCommand } from "@deck-pack/brand-compliance";
import type { CheckFinding } from "@deck-pack/brand-compliance";
import { runPowerPoint } from "../utils";

export async function applyFindingFix(finding: CheckFinding): Promise<void> {
  if (!finding.suggestedFix || !finding.location.shapeId) {
    throw new Error("This issue cannot be fixed automatically.");
  }

  const command = getTextFixCommand(finding.suggestedFix.type);
  if (!command) {
    throw new Error(`Unsupported fix type: ${finding.suggestedFix.type}`);
  }

  return runPowerPoint(async (context) => {
    const slide = context.presentation.slides.getItem(finding.location.slideId);
    const shape = slide.shapes.getItem(finding.location.shapeId!);
    await command.apply(
      shape.textFrame,
      finding.location.textStart,
      finding.location.textLength,
      finding.suggestedFix!.payload,
      context,
    );
    await context.sync();
  });
}
```

`getTargetRange` (the small helper for resolving a substring vs. the whole text range) moves into `brand-compliance`'s individual `TextFixCommand` implementations (each command calls it internally, since each already knows whether it operates on a substring or the whole frame) — it's no longer needed here.

## Target file tree

Identical to current, only `fixes/apply-finding-fix.ts` changes internally; no files move.

```
packages/office-js/src/
  client.ts
  utils.ts
  types.ts
  agenda/
  capabilities/
  capture/
  constants/
  extract/
  fixes/
    apply-finding-fix.ts        — rewritten to delegate to @deck-pack/brand-compliance's getTextFixCommand
  format/
  ignores/
  navigation/
  selection/
  settings/
  snapshot/
  test-utils/
  index.ts
```

## Design patterns implemented here, and what each solves

| Pattern                                      | File(s)                                                          | Problem solved                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adapter**                                  | the whole package, capability by capability                      | Translates the Office.js/PowerPoint JS API (callback-based `addHandlerAsync`, `context.sync()` batching model) into promise-based, testable functions the rest of the stack (`apps/addins`, `packages/shape-commands`, `packages/brand-compliance`) can call without knowing Office.js's specific API shape |
| **Port**                                     | `selection/subscribe-selection-changes.ts` (`OfficeContextPort`) | Lets selection-change subscription be tested with `test-utils/fake-powerpoint-context.ts` instead of a real Office runtime                                                                                                                                                                                  |
| **Command execution (consumer side)**        | `format/execute-formatting-command.ts`                           | Executes any `shape-commands` `FormattingCommand` polymorphically — this file needs zero changes when a new formatting command is added to that package                                                                                                                                                     |
| **Command execution (consumer side, fixed)** | `fixes/apply-finding-fix.ts` (after the fix)                     | Same idea applied to `brand-compliance`'s new `TextFixCommand` registry — removes the last `switch` statement flagged in this whole refactor                                                                                                                                                                |
| **OOP facade over a legacy callback API**    | `client.ts` (`OfficeClient`)                                     | Presents `insertImage`/`insertSlides`/`detect`/`isAvailable` as normal async methods and getters over Office.js's older callback-based `Office.context.document.setSelectedDataAsync` API                                                                                                                   |

## Migration order

1. No structural change to this package except `fixes/apply-finding-fix.ts` — do this only after `packages/brand-compliance`'s `textFixRegistry` exists (depends on that migration completing first).
2. Update the import for `AnyFormattingCommand`/`CheckFinding` types across this package from `@deck-pack/presentation-formatting`/`@deck-pack/presentation-check` to `@deck-pack/shape-commands`/`@deck-pack/brand-compliance` once those renames land.
