import { expect, test } from "@playwright/test";

import { assertPageRendered, injectSessionCookies, seedOpsAdminSession } from "./helpers/auth";

/**
 * Every static ops route that an admin can open without a seeded resource id.
 * Dynamic detail routes ($orgId, $itemId, …) are covered separately when we have ids.
 */
const OPS_STATIC_ROUTES: Array<{ path: string; heading?: string | RegExp }> = [
  { path: "/dashboard", heading: "Dashboard" },
  { path: "/organizations", heading: "Organizations" },
  { path: "/organizations/new", heading: "New organization" },
  { path: "/users", heading: "Users" },
  { path: "/plans", heading: "Plans" },
  { path: "/plans/new", heading: "New plan" },
  { path: "/plans/subscriptions", heading: "Subscriptions" },
  { path: "/plans/subscriptions/new", heading: "New subscription" },
  { path: "/gallery/flags", heading: "Flags" },
  { path: "/gallery/flags/new", heading: /New flag/i },
  { path: "/gallery/shapes", heading: "Shapes" },
  { path: "/gallery/shapes/new", heading: /New shape/i },
  { path: "/gallery/slides", heading: "Slides" },
  { path: "/gallery/slides/new", heading: /New slide/i },
];

test.describe("ops pages render", () => {
  test("every static ops route renders for a seeded admin", async ({ page, context }) => {
    const session = await seedOpsAdminSession();
    await injectSessionCookies(context, session);

    for (const route of OPS_STATIC_ROUTES) {
      await test.step(route.path, async () => {
        await page.goto(route.path);
        await assertPageRendered(page, {
          heading: route.heading,
          url: new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
        });
      });
    }
  });

  test("organizations detail and missing gallery item render gracefully", async ({
    page,
    context,
  }) => {
    const session = await seedOpsAdminSession();
    await injectSessionCookies(context, session);

    // Missing resource ids should not crash the shell (not-found / error copy is OK).
    const missing = [
      `/organizations/${crypto.randomUUID()}`,
      `/gallery/shapes/${crypto.randomUUID()}`,
      `/gallery/flags/${crypto.randomUUID()}`,
      `/gallery/slides/${crypto.randomUUID()}`,
      `/plans/${crypto.randomUUID()}`,
      `/plans/subscriptions/${crypto.randomUUID()}`,
    ];

    for (const path of missing) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
        await expect(page.getByRole("textbox", { name: /email/i })).toHaveCount(0);
        await expect(page.locator("#app")).toBeVisible();
      });
    }
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible({ timeout: 30_000 });
  });
});
