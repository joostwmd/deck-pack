import { test } from "@playwright/test";

import { assertPageRendered, injectSessionCookies, seedPortalSoloSession } from "./helpers/auth";

/** Smoke retained for quick local runs; full coverage lives in portal-pages.spec.ts. */
test("portal authenticated user leaves OTP sign-in", async ({ page, context }) => {
  const session = await seedPortalSoloSession();
  await injectSessionCookies(context, session);

  await page.goto("/");
  await assertPageRendered(page, { url: /\/solo\// });
});
