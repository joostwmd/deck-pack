export type SessionContinuity =
  | { mode: "allow-silent-restore" }
  | { mode: "require-explicit-sign-in" };

export const ALLOW_SILENT_RESTORE: SessionContinuity = { mode: "allow-silent-restore" };
export const REQUIRE_EXPLICIT_SIGN_IN: SessionContinuity = { mode: "require-explicit-sign-in" };

export interface SessionContinuityStore {
  get(): SessionContinuity;
  set(next: SessionContinuity): void;
}

export interface SessionRestorePolicy {
  shouldAttemptSilentRestore(): boolean;
}

export class ContinuityAwareRestorePolicy implements SessionRestorePolicy {
  constructor(private readonly continuity: SessionContinuityStore) {}

  shouldAttemptSilentRestore(): boolean {
    return this.continuity.get().mode === "allow-silent-restore";
  }
}

export function markExplicitSignIn(continuity: SessionContinuityStore): void {
  continuity.set(ALLOW_SILENT_RESTORE);
}

export function markExplicitSignOut(continuity: SessionContinuityStore): void {
  continuity.set(REQUIRE_EXPLICIT_SIGN_IN);
}

/** Web preview: continuity is irrelevant; always allow silent restore semantics. */
export class NoOpSessionContinuityStore implements SessionContinuityStore {
  get(): SessionContinuity {
    return ALLOW_SILENT_RESTORE;
  }

  set(_next: SessionContinuity): void {
    // no-op
  }
}
