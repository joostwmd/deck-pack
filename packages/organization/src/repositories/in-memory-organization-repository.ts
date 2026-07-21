import {
  InvalidOrganizationTypeError,
  OrganizationNotFoundError,
  OrganizationSlugConflictError,
  UserAlreadyInOrganizationError,
} from "../domain/errors";
import { ORGANIZATION_TYPES } from "../domain/organization";
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
import type { OrganizationRepository } from "./organization-repository";

const OWNER_ROLE = "organizationOwner" as const;

type SeedUser = {
  id: string;
  name: string;
  email: string;
};

type SeedOrganization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  type: OrganizationType | null;
  ownerUserId: string | null;
};

type SeedMember = {
  memberId: string;
  organizationId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private users = new Map<string, SeedUser>();
  private organizations = new Map<string, SeedOrganization>();
  private members: SeedMember[] = [];

  seed(input: {
    users?: SeedUser[];
    organizations?: Array<
      SeedOrganization & {
        members?: Array<Omit<SeedMember, "organizationId" | "name" | "email"> & { email?: string }>;
      }
    >;
  }): void {
    for (const u of input.users ?? []) {
      this.users.set(u.email.toLowerCase(), { ...u, email: u.email.toLowerCase() });
    }

    for (const org of input.organizations ?? []) {
      const { members: orgMembers, ...orgData } = org;
      this.organizations.set(org.id, orgData);

      for (const m of orgMembers ?? []) {
        const user =
          [...this.users.values()].find((u) => u.id === m.userId) ??
          (m.email ? this.users.get(m.email.toLowerCase()) : undefined);

        this.members.push({
          memberId: m.memberId,
          organizationId: org.id,
          userId: m.userId,
          name: user?.name ?? "Unknown",
          email: user?.email ?? m.email ?? "",
          role: m.role,
          createdAt: m.createdAt,
        });
      }
    }
  }

  async findUserByEmail(email: string): Promise<UserLookup> {
    const row = this.users.get(email.toLowerCase());
    if (!row) {
      return { found: false };
    }

    const hasOrg = this.members.some((m) => m.userId === row.id);
    return {
      found: true,
      name: row.name,
      email: row.email,
      hasOrg,
    };
  }

  async list(): Promise<OrganizationSummary[]> {
    return [...this.organizations.values()].map((org) => {
      const owner = org.ownerUserId
        ? [...this.users.values()].find((u) => u.id === org.ownerUserId)
        : undefined;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        ownerEmail: owner?.email ?? null,
        type: org.type,
      };
    });
  }

  async findById(organizationId: string): Promise<OrganizationDetail | null> {
    const org = this.organizations.get(organizationId);
    if (!org) {
      return null;
    }

    const owner = org.ownerUserId
      ? [...this.users.values()].find((u) => u.id === org.ownerUserId)
      : undefined;
    const memberCount = this.members.filter((m) => m.organizationId === organizationId).length;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      ownerEmail: owner?.email ?? null,
      ownerName: owner?.name ?? null,
      memberCount,
      type: org.type,
    };
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    return this.members
      .filter((m) => m.organizationId === organizationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) => ({
        memberId: m.memberId,
        userId: m.userId,
        name: m.name,
        email: m.email,
        role: m.role,
        createdAt: m.createdAt,
      }));
  }

  async create(input: CreateOrganizationInput): Promise<CreateOrganizationResult> {
    const normalizedEmail = input.ownerEmail.toLowerCase();
    const slug = input.slug.toLowerCase();
    const type: OrganizationType = input.type ?? "team";

    if ([...this.organizations.values()].some((o) => o.slug === slug)) {
      throw new OrganizationSlugConflictError(slug);
    }

    let existingUser = this.users.get(normalizedEmail);
    if (existingUser && this.members.some((m) => m.userId === existingUser!.id)) {
      throw new UserAlreadyInOrganizationError();
    }

    const isNewUser = !existingUser;
    if (!existingUser) {
      const displayName =
        normalizedEmail
          .split("@")[0]
          ?.replace(/[._-]+/g, " ")
          .trim() || "User";
      existingUser = {
        id: crypto.randomUUID(),
        name: displayName,
        email: normalizedEmail,
      };
      this.users.set(normalizedEmail, existingUser);
    }

    const organizationId = crypto.randomUUID();
    const now = new Date();

    this.organizations.set(organizationId, {
      id: organizationId,
      name: input.name,
      slug,
      createdAt: now,
      type,
      ownerUserId: existingUser.id,
    });

    this.members.push({
      memberId: crypto.randomUUID(),
      organizationId,
      userId: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: OWNER_ROLE,
      createdAt: now,
    });

    return {
      organizationId,
      userId: existingUser.id,
      isNewUser,
    };
  }

  async update(input: UpdateOrganizationInput): Promise<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    type: OrganizationType | null;
  }> {
    const org = this.organizations.get(input.organizationId);
    if (!org) {
      throw new OrganizationNotFoundError(input.organizationId);
    }

    const slug = input.slug.toLowerCase();
    if (
      [...this.organizations.values()].some((o) => o.slug === slug && o.id !== input.organizationId)
    ) {
      throw new OrganizationSlugConflictError(slug);
    }

    if (input.type !== undefined && !ORGANIZATION_TYPES.includes(input.type)) {
      throw new InvalidOrganizationTypeError();
    }

    const updated: SeedOrganization = {
      ...org,
      name: input.name,
      slug,
      type: input.type !== undefined ? input.type : org.type,
    };
    this.organizations.set(input.organizationId, updated);

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      createdAt: updated.createdAt,
      type: updated.type,
    };
  }

  async delete(organizationId: string): Promise<{ organizationId: string }> {
    if (!this.organizations.has(organizationId)) {
      throw new OrganizationNotFoundError(organizationId);
    }

    this.organizations.delete(organizationId);
    this.members = this.members.filter((m) => m.organizationId !== organizationId);
    return { organizationId };
  }
}
