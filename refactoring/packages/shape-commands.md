# `packages/shape-commands` (renamed from `presentation-formatting`)

Kind: **domain-shaped pure-logic package** — mutation-command toolkit for shape geometry/text-frame properties. This package is already the strongest existing precedent for the Command pattern in the whole codebase (alongside `packages/auth`'s Strategy pattern) — the rename is the only real change; the internal structure needs no rework.

## Rename rationale (restated from the discussion)

Most of what lives here (align/distribute/stack/gap/swap/set-bounds/match-size/rectify-lines) is geometry, not "formatting" — the old name undersold what the package does and, worse, sounded like it overlapped with `brand-compliance`'s typography/formatting _rules_. "Shape commands" makes it unambiguous: this is the mutation-command toolkit, distinct from the read-only audit engine.

## Current state (confirmed) — already exemplary, kept as-is

```
packages/presentation-formatting/src/
  types.ts                    — FormattingActionId, ShapeSelection, SelectedShape, ShapeMutation, FormattingCommand<TParams> interface
  policies.ts
  commands/
    align.ts, distribute.ts, match-size.ts, stack.ts, gap.ts, swap.ts, rectify-lines.ts, set-bounds.ts, text.ts, mutation-utils.ts
    registry.ts                 — formattingCommandRegistry (flat array) + getFormattingCommandById(id)
  geometry/
    bounds.ts, sort.ts
  test-utils/
    selection.ts
  index.ts
```

`types.ts`'s `FormattingCommand<TParams>` interface (confirmed) — the Command pattern already fully realized:

```typescript
export interface FormattingCommand<TParams = undefined> {
  readonly id: FormattingActionId;
  evaluate(selection: ShapeSelection, params?: TParams): Applicability;
  createPlan(selection: ShapeSelection, params?: TParams): ShapeMutation[];
}
```

`commands/registry.ts` (confirmed, in full) — the registry pattern `brand-compliance`'s new `textFixRegistry` (see `packages/brand-compliance.md`) is deliberately modeled after:

```typescript
export const formattingCommandRegistry = [
  ...alignCommands,
  ...distributeCommands,
  ...matchSizeCommands,
  ...stackCommands,
  ...gapCommands,
  ...swapCommands,
  rectifyLinesCommand,
  setBoundsCommand,
  ...textCommands,
] satisfies AnyFormattingCommand[];

export function getFormattingCommandById(id: FormattingActionId): AnyFormattingCommand | undefined {
  return formattingCommandRegistry.find((command) => command.id === id);
}
```

`ShapeMutation` (confirmed) — the canonical geometry/text-frame-property vocabulary this whole package outputs, and the reason `brand-compliance` did **not** try to reuse it for font-level text fixes (see `packages/brand-compliance.md`'s "why a separate registry" section — `ShapeMutation` has no `fontName`/`fontColor` fields and its `text` field replaces a whole frame, not a character range):

```typescript
export type ShapeMutation = {
  shapeId: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rotation?: number;
  autoSizeSetting?: TextAutoSizeMode;
  leftMargin?: number;
  rightMargin?: number;
  topMargin?: number;
  bottomMargin?: number;
  wordWrap?: boolean;
  verticalAlignment?: TextVerticalAlignmentMode;
  text?: string;
};
```

## Target file tree

Identical to current, just the package (folder + `package.json` name) renamed:

```
packages/shape-commands/
  src/
    types.ts
    policies.ts
    commands/           — unchanged, 9 command files + registry.ts
    geometry/            — unchanged
    test-utils/
    index.ts
```

## Design patterns implemented here, and what each solves

| Pattern                                      | File(s)                                                                   | Problem solved                                                                                                                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Command**                                  | `commands/*.ts`, each exporting one or more `FormattingCommand` instances | Encapsulates "is this applicable to the current selection" (`evaluate`) and "what mutations does applying it produce" (`createPlan`) as one cohesive unit per action, instead of a giant conditional dispatching on action id                   |
| **Strategy (lookup by key)**                 | `getFormattingCommandById(id)`                                            | `office-js`'s `execute-formatting-command.ts` (see `packages/office-js.md`) looks up the right command by `FormattingActionId` and calls it polymorphically — it never needs to know how many commands exist or how each is implemented         |
| **Registry (composition of smaller arrays)** | `commands/registry.ts`                                                    | Each command file exports its own small array/const (`alignCommands`, `stackCommands`, ...); `registry.ts` just concatenates them — adding a new command file means adding one spread into this array, not touching any existing command's code |

## What this package explicitly does NOT take on

Per the discussion, `brand-compliance` legitimately depends on `shape-commands` in one direction only (to potentially express certain suggested fixes in `ShapeMutation` vocabulary, for the fix kinds that genuinely are geometry, if any exist today — verify against `profile.ts`'s rule definitions) — this is an intentional, one-directional package dependency, not a merge. `shape-commands` itself has zero knowledge of `brand-compliance`, `CheckFinding`, or brand rules; it only knows about shape selections and mutations. Don't add a dependency in the other direction.

## Migration order

1. Rename the package folder and `package.json` name (`presentation-formatting` → `shape-commands`); update every importer (`office-js`, `apps/addins`, `brand-compliance` if any cross-dependency is confirmed).
2. No internal restructuring needed — this package already matches the target pattern.
