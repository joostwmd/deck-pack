import { AppError } from "@deck-pack/errors";

export class ShortcutConflictError extends AppError {
  readonly conflictingShortcutId: string;
  readonly conflictingDescription: string;

  constructor(conflict: { id: string; description: string }, options?: { cause?: unknown }) {
    super("CONFLICT", `Shortcut already assigned to "${conflict.description}"`, 409, options);
    this.name = "ShortcutConflictError";
    this.conflictingShortcutId = conflict.id;
    this.conflictingDescription = conflict.description;
  }
}

export class ShortcutOverrideSaveFailedError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("INTERNAL", "Failed to save shortcut override", 500, options);
    this.name = "ShortcutOverrideSaveFailedError";
  }
}
