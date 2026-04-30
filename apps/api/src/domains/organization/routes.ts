import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";

import { member, organization, user } from "@deck-pack/db/schema/auth";
import { withTransaction } from "@deck-pack/db/transaction";

import { platformAdminProcedure } from "../../api/procedures";

const OWNER_ROLE = "organizationOwner" as const;

const emailSchema = z.string().trim().email();
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const organizationRoutes = {
  lookupUser: platformAdminProcedure
    .input(z.object({ email: emailSchema }))
    .output(
      z.discriminatedUnion("found", [
        z.object({
          found: z.literal(true),
          name: z.string(),
          email: z.string(),
          hasOrg: z.boolean(),
        }),
        z.object({ found: z.literal(false) }),
      ]),
    )
    .query(async ({ ctx, input }) => {
      const normalizedEmail = input.email.toLowerCase();

      const [row] = await ctx.tx
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(sql`lower(${user.email}) = ${normalizedEmail}`)
        .limit(1);

      if (!row) {
        return { found: false as const };
      }

      const memberships = await ctx.tx
        .select({ id: member.id })
        .from(member)
        .where(eq(member.userId, row.id))
        .limit(1);

      return {
        found: true as const,
        name: row.name,
        email: row.email,
        hasOrg: memberships.length > 0,
      };
    }),

  listOrganizations: platformAdminProcedure
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          createdAt: z.date(),
          ownerEmail: z.string().nullable(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      return ctx.tx
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          createdAt: organization.createdAt,
          ownerEmail: user.email,
        })
        .from(organization)
        .leftJoin(
          member,
          and(eq(member.organizationId, organization.id), eq(member.role, OWNER_ROLE)),
        )
        .leftJoin(user, eq(member.userId, user.id));
    }),

  createOrganization: platformAdminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(256),
        slug: slugSchema,
        ownerEmail: emailSchema,
      }),
    )
    .output(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        isNewUser: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedEmail = input.ownerEmail.toLowerCase();
      const slug = input.slug.toLowerCase();

      return withTransaction(async () => {
        const [slugConflict] = await ctx.tx
          .select({ id: organization.id })
          .from(organization)
          .where(eq(organization.slug, slug))
          .limit(1);

        if (slugConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An organization with this slug already exists",
          });
        }

        const [existingUser] = await ctx.tx
          .select({
            id: user.id,
            email: user.email,
          })
          .from(user)
          .where(sql`lower(${user.email}) = ${normalizedEmail}`)
          .limit(1);

        if (existingUser) {
          const existingMembership = await ctx.tx
            .select({ id: member.id })
            .from(member)
            .where(eq(member.userId, existingUser.id))
            .limit(1);

          if (existingMembership.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This user already belongs to an organization",
            });
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

          await ctx.tx.insert(user).values({
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

        await ctx.tx.insert(organization).values({
          id: organizationId,
          name: input.name,
          slug,
          createdAt: now,
          metadata: null,
          logo: null,
        });

        await ctx.tx.insert(member).values({
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
    }),
};
