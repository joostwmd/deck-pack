# Shortcut schema versioning

This document describes how user shortcut overrides evolve when the shortcut registry changes.

## What does **not** require a schema bump

- Adding a new shortcut command
- Changing a default hotkey for users who never customized it
- Changing descriptions, UI groups, or help copy
- Reorganizing the settings sheet

These changes live in code (`@deck-pack/shortcuts`) and appear automatically for all users.

## What **does** require a schema bump

- Renaming or removing a persisted `shortcutId`
- Splitting one command into multiple commands
- Changing the stored hotkey serialization format

When one of these happens:

1. Add an explicit migration function in `packages/shortcuts/src/migrations.ts`
2. Bump `SHORTCUT_SCHEMA_VERSION` in `packages/shortcuts/src/constants.ts`
3. Deploy API code that can read old rows and write current-version rows
4. Lazily migrate users when `shortcuts.list` loads their overrides
5. Verify adoption, then delete stale rows in a later cleanup migration

## Row model

Each customized shortcut is stored as one row:

```text
user_id + shortcut_id + schema_version -> hotkey
```

Defaults are not stored. Resetting a shortcut deletes its row.

## Example future rename

If `photos` becomes `stockPhotos` in schema version 2:

```ts
const migrateV1ToV2: ShortcutMigration = (rows) =>
  rows
    .filter((row) => row.shortcutId !== "removedCommand")
    .map((row) => ({
      ...row,
      shortcutId: row.shortcutId === "photos" ? "stockPhotos" : row.shortcutId,
      hotkey: canonicalizeHotkey(row.hotkey),
      schemaVersion: 2,
    }));
```

During rollout, current-version rows win if both versions exist for the same resulting command.

## Conflict rules

- Internal conflicts are blocked at save time using scope-aware overlap checks
- Known PowerPoint conflicts are warned in the UI but may be accepted explicitly
- Duplicate chords are allowed only when their runtime scopes cannot be active at the same time
