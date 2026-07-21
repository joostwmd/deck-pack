import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import {
  getOrganizationType,
  ORGANIZATION_TYPES as DB_ORGANIZATION_TYPES,
  parseOrganizationMetadata,
  serializeOrganizationMetadata,
  type OrganizationType as DbOrganizationType,
} from "@deck-pack/db/org-metadata";
import { member, organization, session, user } from "@deck-pack/db/schema/auth";
import type { UnitOfWork } from "@deck-pack/db";

import {
  InvalidOrganizationTypeError,
  OrganizationNotFoundError,
  OrganizationSlugConflictError,
  UserAlreadyInOrganizationError,
} from "../domain/errors";
import type {
  CreateOrganizationInput,
  CreateOrganizationResult,
  OrganizationDetail,
  OrganizationMember,
  OrganizationSummary,
  OrganizationType,
  UpdateOrganizationInput,
  UserLookup,
} from "../domain/organization";

const OWNER_ROLE = "organizationOwner" as const;

export interface OrganizationRepository {
  findUserByEmail(email: string): Promise<UserLookup>;
  list(): Promise<OrganizationSummary[]>;
  findById(organizationId: string): Promise<OrganizationDetail | null>;
  listMembers(organizationId: string): Promise<OrganizationMember[]>;
  create(input: CreateOrganizationInput): Promise<CreateOrganizationResult>;
  update(input: UpdateOrganizationInput): Promise<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    type: OrganizationType | null;
  }>;
  delete(organizationId: string): Promise<{ organizationId: string }>;
}

export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly uow: UnitOfWork) {}

  async findUserByEmail(email: string): Promise<UserLookup> {
    const db = this.uow.getDb();
    const normalizedEmail = email.toLowerCase();

    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(sql`lower(${user.email}) = ${normalizedEmail}`)
      .limit(1);

    if (!row) {
      return { found: false };
    }

    const memberships = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.userId, row.id))
      .limit(1);

    return {
      found: true,
      name: row.name,
      email: row.email,
      hasOrg: memberships.length > 0,
    };
  }

  async list(): Promise<OrganizationSummary[]> {
    const db = this.uow.getDb();
    const rows = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt,
        metadata: organization.metadata,
        ownerEmail: user.email,
      })
      .from(organization)
      .leftJoin(
        member,
        and(eq(member.organizationId, organization.id), eq(member.role, OWNER_ROLE)),
      )
      .leftJoin(user, eq(member.userId, user.id));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.createdAt,
      ownerEmail: row.ownerEmail,
      type: getOrganizationType(row.metadata) as OrganizationType | null,
    }));
  }

  async findById(organizationId: string): Promise<OrganizationDetail | null> {
    const db = this.uow.getDb();
    const [row] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt,
        metadata: organization.metadata,
        ownerEmail: user.email,
        ownerName: user.name,
      })
      .from(organization)
      .leftJoin(
        member,
        and(eq(member.organizationId, organization.id), eq(member.role, OWNER_ROLE)),
      )
      .leftJoin(user, eq(member.userId, user.id))
      .where(eq(organization.id, organizationId))
      .limit(1);

    if (!row) {
      return null;
    }

    const [memberCountRow] = await db
      .select({ value: count() })
      .from(member)
      .where(eq(member.organizationId, organizationId));

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.createdAt,
      ownerEmail: row.ownerEmail,
      ownerName: row.ownerName,
      memberCount: Number(memberCountRow?.value ?? 0),
      type: getOrganizationType(row.metadata) as OrganizationType | null,
    };
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    const db = this.uow.getDb();
    return db
      .select({
        memberId: member.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: member.role,
        createdAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId))
      .orderBy(asc(member.createdAt));
  }

  async create(input: CreateOrganizationInput): Promise<CreateOrganizationResult> {
    return this.uow.withTransaction(async () => {
      const db = this.uow.getDb();
      const normalizedEmail = input.ownerEmail.toLowerCase();
      const slug = input.slug.toLowerCase();
      const type: OrganizationType = input.type ?? "team";
      const metadata = serializeOrganizationMetadata({
        type: type as DbOrganizationType,
      });

      const [slugConflict] = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.slug, slug))
        .limit(1);

      if (slugConflict) {
        throw new OrganizationSlugConflictError(slug);
      }

      const [existingUser] = await db
        .select({
          id: user.id,
          email: user.email,
        })
        .from(user)
        .where(sql`lower(${user.email}) = ${normalizedEmail}`)
        .limit(1);

      if (existingUser) {
        const existingMembership = await db
          .select({ id: member.id })
          .from(member)
          .where(eq(member.userId, existingUser.id))
          .limit(1);

        if (existingMembership.length > 0) {
          throw new UserAlreadyInOrganizationError();
        }
      }

      const isNewUser = !existingUser;
      let ownerUserId: string;

      if (existingUser) {
        ownerUserId = existingUser.id;
      } else {
        const newId = crypto.randomUUID();
        const displayName =
          normalizedEmail
            .split("@")[0]
            ?.replace(/[._-]+/g, " ")
            .trim() || "User";

        await db.insert(user).values({
          id: newId,
          name: displayName,
          email: normalizedEmail,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: null,
        });

        ownerUserId = newId;
      }

      const organizationId = crypto.randomUUID();
      const now = new Date();

      await db.insert(organization).values({
        id: organizationId,
        name: input.name,
        slug,
        createdAt: now,
        metadata,
        logo: null,
      });

      await db.insert(member).values({
        id: crypto.randomUUID(),
        organizationId,
        userId: ownerUserId,
        role: OWNER_ROLE,
        createdAt: now,
      });

      return {
        organizationId,
        userId: ownerUserId,
        isNewUser,
      };
    });
  }

  async update(input: UpdateOrganizationInput): Promise<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    type: OrganizationType | null;
  }> {
    const db = this.uow.getDb();
    const slug = input.slug.toLowerCase();

    const [existing] = await db
      .select({ id: organization.id, metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, input.organizationId))
      .limit(1);

    if (!existing) {
      throw new OrganizationNotFoundError(input.organizationId);
    }

    const [slugConflict] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(and(eq(organization.slug, slug), ne(organization.id, input.organizationId)))
      .limit(1);

    if (slugConflict) {
      throw new OrganizationSlugConflictError(slug);
    }

    if (input.type !== undefined && !DB_ORGANIZATION_TYPES.includes(input.type)) {
      throw new InvalidOrganizationTypeError();
    }

    let metadataUpdate: string | undefined;
    if (input.type !== undefined) {
      const current = parseOrganizationMetadata(existing.metadata) ?? {
        type: "individual" as const,
      };
      metadataUpdate = serializeOrganizationMetadata({ ...current, type: input.type });
    }

    const [updated] = await db
      .update(organization)
      .set({
        name: input.name,
        slug,
        ...(metadataUpdate !== undefined ? { metadata: metadataUpdate } : {}),
      })
      .where(eq(organization.id, input.organizationId))
      .returning({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt,
        metadata: organization.metadata,
      });

    if (!updated) {
      throw new OrganizationNotFoundError(input.organizationId);
    }

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      createdAt: updated.createdAt,
      type: (parseOrganizationMetadata(updated.metadata)?.type ?? null) as OrganizationType | null,
    };
  }

  async delete(organizationId: string): Promise<{ organizationId: string }> {
    const db = this.uow.getDb();

    const [existing] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);

    if (!existing) {
      throw new OrganizationNotFoundError(organizationId);
    }

    await db
      .update(session)
      .set({ activeOrganizationId: null })
      .where(eq(session.activeOrganizationId, organizationId));

    await db.delete(organization).where(eq(organization.id, organizationId));

    return { organizationId };
  }
}
