import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { TestHelpers } from "better-auth/plugins";

import { getTestAuthHelpers, type TestAuth } from "@deck-pack/auth/test-auth";

describe("Better Auth email OTP (testUtils capture)", () => {
  let auth: TestAuth;
  let test: TestHelpers;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const helpers = await getTestAuthHelpers();
    auth = helpers.auth;
    test = helpers.test;
  }, 30_000);

  afterEach(async () => {
    test.clearOTPs?.();
    for (const userId of createdUserIds.splice(0)) {
      await test.deleteUser(userId).catch(() => undefined);
    }
  });

  it("captures sign-in OTP and completes email OTP sign-in", async () => {
    const email = `otp-${crypto.randomUUID()}@test.local`;
    const user = test.createUser({ email, emailVerified: true, name: "OTP User" });
    await test.saveUser(user);
    createdUserIds.push(user.id);

    await auth.api.sendVerificationOTP({
      body: { email, type: "sign-in" },
    });

    const otp = test.getOTP?.(email);
    expect(otp).toBeDefined();
    expect(otp!.length).toBeGreaterThanOrEqual(4);

    const signedIn = await auth.api.signInEmailOTP({
      body: { email, otp: otp! },
    });

    expect(signedIn).toMatchObject({
      user: expect.objectContaining({ email }),
    });
  });
});
