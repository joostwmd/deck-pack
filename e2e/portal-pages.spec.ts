import { expect, test } from "@playwright/test";

import {
  assertPageRendered,
  injectSessionCookies,
  seedPortalSoloSession,
  seedPortalTeamSession,
} from "./helpers/auth";

const PORTAL_SOLO_ROUTES: Array<{ path: string; heading?: string | RegExp }> = [
  { path: "/solo/home", heading: "Home" },
  { path: "/solo/account", heading: "Account" },
];

const PORTAL_TEAM_ROUTES: Array<{ path: string; heading?: string | RegExp }> = [
  { path: "/org/dashboard", heading: "Dashboard" },
  { path: "/org/members", heading: "Members" },
  { path: "/org/seats", heading: "Seats" },
  { path: "/org/billing", heading: "Billing" },
  { path: "/org/gallery/shapes", heading: "Shapes" },
  { path: "/org/gallery/shapes/new", heading: /New shape/i },
  { path: "/org/gallery/flags", heading: "Flags" },
  { path: "/org/gallery/flags/new", heading: /New flag/i },
  { path: "/org/gallery/slides", heading: "Slides" },
  { path: "/org/gallery/slides/new", heading: /New slide/i },
];

test.describe("portal pages render", () => {
  test("solo user reaches home and every solo route renders", async ({ page, context }) => {
    const session = await seedPortalSoloSession();
    await injectSessionCookies(context, session);

    await page.goto("/");
    await assertPageRendered(page, { url: /\/solo\// });

    for (const route of PORTAL_SOLO_ROUTES) {
      await test.step(route.path, async () => {
        await page.goto(route.path);
        await assertPageRendered(page, {
          heading: route.heading,
          url: new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
        });
      });
    }
  });

  test("team owner reaches every org route", async ({ page, context }) => {
    const session = await seedPortalTeamSession();
    await injectSessionCookies(context, session);

    await page.goto("/");
    await assertPageRendered(page, { url: /\/org\// });

    for (const route of PORTAL_TEAM_ROUTES) {
      await test.step(route.path, async () => {
        await page.goto(route.path);
        await assertPageRendered(page, {
          heading: route.heading,
          url: new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
        });
      });
    }

    // Team users may still open account.
    await page.goto("/solo/account");
    await assertPageRendered(page, { heading: "Account", url: /\/solo\/account/ });
  });

  test("join and missing invitation/gallery detail do not crash", async ({ page, context }) => {
    const session = await seedPortalTeamSession();
    await injectSessionCookies(context, session);

    for (const path of [
      "/join",
      `/accept-invitation/${crypto.randomUUID()}`,
      `/org/gallery/shapes/${crypto.randomUUID()}`,
      `/org/gallery/flags/${crypto.randomUUID()}`,
      `/org/gallery/slides/${crypto.randomUUID()}`,
    ]) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
        await expect(page.locator("#app")).toBeVisible();
      });
    }
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible({ timeout: 30_000 });
  });
});
