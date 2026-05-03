import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../index";
import { member, organization, user } from "../schema/auth";
import { tx } from "../transaction";
import { isOrganizationMember } from "./isOrganizationMember";
import { isPlatformAdmin } from "./isPlatformAdmin";

describe("DB queries (integration)", () => {
  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`,
      ),
    );
  });

  it("isPlatformAdmin reflects user.role === admin", async () => {
    const userId = crypto.randomUUID();
    const now = new Date();
    await db.insert(user).values({
      id: userId,
      name: "Platform",
      email: "plat@integration.test.local",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: "admin",
    });

    expect(await isPlatformAdmin({ tx, userId })).toBe(true);

    await db.update(user).set({ role: null }).where(eq(user.id, userId));
    expect(await isPlatformAdmin({ tx, userId })).toBe(false);
  });

  it("isOrganizationMember detects membership row for user and organization", async () => {
    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name: "Member",
      email: "mbr@integration.test.local",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: null,
    });

    await db.insert(organization).values({
      id: orgId,
      name: "Org",
      slug: "integration-org",
      createdAt: now,
      metadata: null,
      logo: null,
    });

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId,
      role: "member",
      createdAt: now,
    });

    expect(await isOrganizationMember({ tx, userId, organizationId: orgId })).toBe(true);
    expect(await isOrganizationMember({ tx, userId, organizationId: crypto.randomUUID() })).toBe(
      false,
    );
  });
});
