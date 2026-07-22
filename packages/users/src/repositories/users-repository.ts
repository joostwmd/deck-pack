import { asc, eq } from "drizzle-orm";
import { getOrganizationType } from "@deck-pack/db/org-metadata";
import { member, organization, user } from "@deck-pack/db/schema/auth";
import type { UnitOfWork } from "@deck-pack/db";

import { UserNotFoundError } from "../domain/errors";
import type { OrganizationType, UserWithMembership } from "../domain/user";

export interface UsersRepository {
  list(): Promise<UserWithMembership[]>;
  delete(userId: string): Promise<{ userId: string }>;
  isPlatformAdmin(userId: string): Promise<boolean>;
}

export class DrizzleUsersRepository implements UsersRepository {
  constructor(private readonly uow: UnitOfWork) {}

  async list(): Promise<UserWithMembership[]> {
    const db = this.uow.getDb();
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: user.banned,
        createdAt: user.createdAt,
        organizationId: organization.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        organizationMetadata: organization.metadata,
        memberRole: member.role,
      })
      .from(user)
      .leftJoin(member, eq(member.userId, user.id))
      .leftJoin(organization, eq(organization.id, member.organizationId))
      .orderBy(asc(user.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      emailVerified: row.emailVerified,
      banned: Boolean(row.banned),
      createdAt: row.createdAt,
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      organizationSlug: row.organizationSlug,
      organizationType: getOrganizationType(row.organizationMetadata) as OrganizationType | null,
      memberRole: row.memberRole,
    }));
  }

  async delete(userId: string): Promise<{ userId: string }> {
    const db = this.uow.getDb();

    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!existing) {
      throw new UserNotFoundError(userId);
    }

    await db.delete(user).where(eq(user.id, userId));

    return { userId };
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return row?.role === "admin";
  }
}
