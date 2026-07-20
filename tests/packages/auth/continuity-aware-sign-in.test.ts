import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_SILENT_RESTORE,
  ContinuityAwareSignInDecorator,
  REQUIRE_EXPLICIT_SIGN_IN,
  withContinuityAwareSignIn,
} from "@deck-pack/auth/microsoft-sign-in";
import type { MicrosoftSignInStrategy } from "@deck-pack/auth/microsoft-sign-in";

function createInMemoryContinuity() {
  let value = REQUIRE_EXPLICIT_SIGN_IN;
  return {
    get: () => value,
    set: (next: typeof value) => {
      value = next;
    },
  };
}

describe("ContinuityAwareSignInDecorator", () => {
  it("sets allow-silent-restore only when sign-in succeeds", async () => {
    const inner: MicrosoftSignInStrategy = {
      signIn: vi.fn().mockResolvedValue({ ok: true, bearerToken: "token" }),
    };
    const continuity = createInMemoryContinuity();
    const decorator = new ContinuityAwareSignInDecorator(inner, continuity);

    const result = await decorator.signIn();

    expect(result).toEqual({ ok: true, bearerToken: "token" });
    expect(continuity.get()).toEqual(ALLOW_SILENT_RESTORE);
  });

  it("does not change continuity when sign-in fails", async () => {
    const inner: MicrosoftSignInStrategy = {
      signIn: vi.fn().mockResolvedValue({ ok: false, error: "denied" }),
    };
    const continuity = createInMemoryContinuity();
    const decorator = new ContinuityAwareSignInDecorator(inner, continuity);

    const result = await decorator.signIn();

    expect(result).toEqual({ ok: false, error: "denied" });
    expect(continuity.get()).toEqual(REQUIRE_EXPLICIT_SIGN_IN);
  });
});

describe("withContinuityAwareSignIn", () => {
  it("wraps the strategy with the decorator", async () => {
    const inner: MicrosoftSignInStrategy = {
      signIn: vi.fn().mockResolvedValue({ ok: true }),
    };
    const continuity = createInMemoryContinuity();
    const wrapped = withContinuityAwareSignIn(inner, continuity);

    await wrapped.signIn();

    expect(continuity.get()).toEqual(ALLOW_SILENT_RESTORE);
  });
});
