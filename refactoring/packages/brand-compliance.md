# `packages/brand-compliance` (renamed from `presentation-check`)

Kind: **domain-shaped pure-logic package** — read-only compliance analysis engine. Not "domain" in the package-per-backend-domain sense (§3.1, no DB), but the same instinct: one focused responsibility, consumed by `office-js` as an adapter target.

## Rename rationale (restated from the discussion)

`presentation-check` is generic — "checks a presentation" against what? The actual answer is: against a `BrandProfileConfiguration` (`packages/domain-template.md`'s `brand-profiles` backend domain). Renaming to `brand-compliance` reuses a noun that already exists elsewhere in the system instead of inventing a new "presentation-" prefix, and immediately tells a reader what's being checked against what.

## Current state (confirmed)

```
packages/presentation-check/src/
  engine.ts        — the check engine (walks a PresentationSnapshot, applies rules, returns findings)
  types.ts           — PresentationSnapshot, ShapeSnapshot, SlideSnapshot, FindingLocation, SuggestedFix, CheckFinding, CheckResult
  profile.ts           — FixMode, IssueSeverity, and presumably the rule/profile shape
  schemas.ts
  color.ts
  index.ts
```

`types.ts`'s `SuggestedFix` (confirmed, in full) — this is the free-form bag being replaced:

```typescript
export interface SuggestedFix {
  type: string;
  safe: boolean;
  payload: Record<string, unknown>;
}
```

`type: string` + `payload: Record<string, unknown>` is exactly the shape that forces a `switch (fix.type)` downstream with no compile-time link between a `type` string and its expected `payload` shape — see `apply-finding-fix.ts` in `packages/office-js.md` for where that cost is paid today.

## Target file tree

```
packages/brand-compliance/
  package.json
  src/
    engine.ts
    types.ts                    — CheckFinding.suggestedFix now typed as TextFixDescriptor (see below), not a free-form bag
    profile.ts
    schemas.ts
    color.ts
    fixes/
      text-fix-command.ts         — TextFixCommand interface (NEW)
      set-font-name-fix.ts          — SetFontNameFix implements TextFixCommand (NEW)
      set-font-color-fix.ts          — SetFontColorFix implements TextFixCommand (NEW)
      replace-text-range-fix.ts       — ReplaceTextRangeFix implements TextFixCommand (NEW)
      normalize-whitespace-fix.ts      — NormalizeWhitespaceFix implements TextFixCommand (NEW)
      trim-text-fix.ts                  — TrimTextFix implements TextFixCommand (NEW)
      registry.ts                        — textFixRegistry + getTextFixCommand(kind) (NEW)
    index.ts
```

## Why a _separate_ `TextFixCommand` registry, not reuse of `shape-commands`'s `ShapeMutation`

This was explicitly checked and rejected: `shape-commands`'s `ShapeMutation` (`packages/shape-commands.md`) covers geometry (`left`/`top`/`width`/`height`/`rotation`) and a handful of text-frame-level settings (`autoSizeSetting`, margins, `wordWrap`, `verticalAlignment`, whole-frame `text`) — it has **no font name/color fields**, and its `text` field replaces the _whole_ frame's text, not a specific character range. The five real fix kinds today (`set-font-name`, `set-font-color`, `replace-text-range`, `normalize-whitespace`, `trim-text`) all operate on a `PowerPoint.TextRange` obtained via `textFrame.textRange.getSubstring(start, length)` — a different primitive than `ShapeMutation` targets. Stretching `ShapeMutation` to cover this would blur two already-distinct vocabularies (geometry mutation vs. typography/text-content fix) rather than clarify them. Two small, parallel command registries — each scoped to what it actually needs — is the correct amount of ceremony here, not one merged one.

## Target code

```typescript
// fixes/text-fix-command.ts
export interface TextFixCommand<TPayload = unknown> {
  readonly kind: string;
  apply(
    textFrame: PowerPoint.TextFrame,
    textStart: number | undefined,
    textLength: number | undefined,
    payload: TPayload,
  ): Promise<void>;
}
```

```typescript
// fixes/set-font-name-fix.ts
export class SetFontNameFix implements TextFixCommand<{ fontName: string }> {
  readonly kind = "set-font-name";
  async apply(
    textFrame: PowerPoint.TextFrame,
    textStart: number | undefined,
    textLength: number | undefined,
    payload: { fontName: string },
  ): Promise<void> {
    const range = getTargetRange(textFrame, textStart, textLength);
    range.font.name = payload.fontName;
  }
}
```

```typescript
// fixes/normalize-whitespace-fix.ts
export class NormalizeWhitespaceFix implements TextFixCommand<Record<string, never>> {
  readonly kind = "normalize-whitespace";
  async apply(
    textFrame: PowerPoint.TextFrame,
    _start: undefined,
    _length: undefined,
    _payload: unknown,
    context: PowerPoint.RequestContext,
  ): Promise<void> {
    textFrame.textRange.load("text");
    await context.sync();
    textFrame.textRange.text = textFrame.textRange.text.replace(/\s{2,}/g, " ");
  }
}
```

```typescript
// fixes/registry.ts
export const textFixRegistry: TextFixCommand[] = [
  new SetFontNameFix(),
  new SetFontColorFix(),
  new ReplaceTextRangeFix(),
  new NormalizeWhitespaceFix(),
  new TrimTextFix(),
];

export function getTextFixCommand(kind: string): TextFixCommand | undefined {
  return textFixRegistry.find((command) => command.kind === kind);
}
```

`types.ts`'s `SuggestedFix` narrows from a free-form bag to a typed union, one variant per registered command:

```typescript
export type SuggestedFix =
  | { type: "set-font-name"; safe: boolean; payload: { fontName: string } }
  | { type: "set-font-color"; safe: boolean; payload: { color: string } }
  | { type: "replace-text-range"; safe: boolean; payload: { replacement: string } }
  | { type: "normalize-whitespace"; safe: boolean; payload: Record<string, never> }
  | { type: "trim-text"; safe: boolean; payload: Record<string, never> };
```

Now `fix.type` and `fix.payload`'s shape are compiler-linked — adding a sixth fix kind means adding one union member, one `TextFixCommand` class, and one registry entry; there is no `switch` anywhere to remember to update.

## Relationship to `brand-profiles` (the backend domain)

`brand-compliance`'s `engine.ts` takes a `BrandProfileConfiguration`-shaped ruleset as input (verify the exact current parameter name/shape in `profile.ts` before implementing) — that configuration is authored/persisted through the `brand-profiles` backend domain (`packages/domain-template.md`). This package itself has **no dependency on `@deck-pack/db`** — the add-in fetches the active brand profile via tRPC, then passes the resulting plain object into `engine.ts`, keeping this package pure/testable without a database.

## Design patterns implemented here, and what each solves

| Pattern                      | File(s)                           | Problem solved                                                                                                                                                                                    |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Command** (NEW)            | `fixes/*.ts`, `fixes/registry.ts` | Each fixable issue type is a self-contained class (kind + how to apply it); adding a new fixable rule means adding one file, not editing a `switch` in a different package (`office-js`)          |
| **Strategy (lookup by key)** | `getTextFixCommand(kind)`         | Selects the correct fix implementation at runtime from `CheckFinding.suggestedFix.type`, decoupling the check engine (which only needs to _describe_ a fix) from `office-js` (which _applies_ it) |

## Migration order

1. Rename the package folder and its `package.json` name (`presentation-check` → `brand-compliance`); update every importer (`office-js`, `apps/addins`).
2. Add `fixes/text-fix-command.ts` + the five concrete fix classes + `registry.ts`, porting the exact logic currently inline in `office-js/src/fixes/apply-finding-fix.ts`'s `switch` cases.
3. Narrow `SuggestedFix` to the typed union; update `engine.ts`'s rule implementations that currently construct `{ type: "...", payload: {...} }` literals to match the new union members (should be a type-checking exercise more than a logic change, since the literal shapes are already correct).
4. Update `office-js/src/fixes/apply-finding-fix.ts` per `packages/office-js.md` to delegate to `getTextFixCommand` instead of switching.
