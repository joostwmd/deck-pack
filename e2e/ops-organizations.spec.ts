import { test } from "@playwright/test";

import { assertPageRendered, injectSessionCookies, seedOpsAdminSession } from "./helpers/auth";

/** Smoke retained for quick local runs; full coverage lives in *-pages.spec.ts. */
test("ops organizations page loads for seeded admin", async ({ page, context }) => {
  const session = await seedOpsAdminSession();
  await injectSessionCookies(context, session);

  await page.goto("/organizations");
  await assertPageRendered(page, { heading: "Organizations", url: /\/organizations\/?$/ });
});
