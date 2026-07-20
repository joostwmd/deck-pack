import { describe, expect, it } from "vitest";

import {
  ALLOW_SILENT_RESTORE,
  ContinuityAwareRestorePolicy,
  NoOpSessionContinuityStore,
  REQUIRE_EXPLICIT_SIGN_IN,
  markExplicitSignIn,
  markExplicitSignOut,
} from "@deck-pack/auth/microsoft-sign-in";

function createInMemoryContinuity() {
  let value = ALLOW_SILENT_RESTORE;
  return {
    get: () => value,
    set: (next: typeof value) => {
      value = next;
    },
  };
}

describe("ContinuityAwareRestorePolicy", () => {
  it("allows silent restore when continuity is allow-silent-restore", () => {
    const store = createInMemoryContinuity();
    const policy = new ContinuityAwareRestorePolicy(store);

    expect(policy.shouldAttemptSilentRestore()).toBe(true);
  });

  it("blocks silent restore after explicit sign-out", () => {
    const store = createInMemoryContinuity();
    markExplicitSignOut(store);
    const policy = new ContinuityAwareRestorePolicy(store);

    expect(policy.shouldAttemptSilentRestore()).toBe(false);
  });

  it("allows silent restore again after explicit sign-in", () => {
    const store = createInMemoryContinuity();
    markExplicitSignOut(store);
    markExplicitSignIn(store);
    const policy = new ContinuityAwareRestorePolicy(store);

    expect(policy.shouldAttemptSilentRestore()).toBe(true);
  });
});

describe("markExplicitSignIn / markExplicitSignOut", () => {
  it("transitions continuity through sign-out and sign-in", () => {
    const store = createInMemoryContinuity();

    expect(store.get()).toEqual(ALLOW_SILENT_RESTORE);

    markExplicitSignOut(store);
    expect(store.get()).toEqual(REQUIRE_EXPLICIT_SIGN_IN);

    markExplicitSignIn(store);
    expect(store.get()).toEqual(ALLOW_SILENT_RESTORE);
  });
});

describe("NoOpSessionContinuityStore", () => {
  it("always reports allow-silent-restore and ignores set", () => {
    const store = new NoOpSessionContinuityStore();

    expect(store.get()).toEqual(ALLOW_SILENT_RESTORE);

    store.set(REQUIRE_EXPLICIT_SIGN_IN);
    expect(store.get()).toEqual(ALLOW_SILENT_RESTORE);
  });
});
