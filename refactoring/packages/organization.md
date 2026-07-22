# `packages/organization` (NEW) — reference domain package

This is the **template every other domain package follows**. It's documented first and in the most detail because `organization` is the simplest domain (no Saga, no external integrations, no file storage) — migrate it first, get this shape exactly right, then repeat mechanically for the rest.

## Current state (`apps/api/src/domains/organization/`)

```
apps/api/src/domains/organization/
  routes.ts       — createOrganizationRoutes(service) — tRPC procedures
  schemas.ts       — organizationEmailSchema, organizationSlugSchema
  service.ts        — createOrganizationService(deps) — function factory, typeof-injected query functions
```

Real current code, `service.ts` (function-factory + `ServiceResult` style):

```typescript
export type OrganizationServiceDeps = {
  findUserByEmail: typeof findUserByEmail;
  listOrganizationsWithOwner: typeof listOrganizationsWithOwner;
  createOrganizationWithOwner: typeof createOrganizationWithOwner;
  getOrganizationWithOwner: typeof getOrganizationWithOwner;
  listOrganizationMembers: typeof listOrganizationMembers;
  updateOrganization: typeof updateOrganization;
  deleteOrganization: typeof deleteOrganization;
};

export function createOrganizationService(deps: OrganizationServiceDeps) {
  return {
    createOrganization: async (tx: Transaction, input: {...}): Promise<ServiceResult<{...}>> => {
      const result = await deps.createOrganizationWithOwner({ tx, input: {...} });
      if (!result.ok) {
        if (result.reason === "slug_conflict") return serviceFail("conflict", { message: "..." });
        return serviceFail("invalid_state", { message: "..." });
      }
      return serviceOk({ organizationId: result.organizationId, ... });
    },
    // ...6 more methods, same shape
  };
}
```

Two things this migration removes: (1) `deps` is a bag of raw query _functions_ (`typeof findUserByEmail`) rather than a Repository object — every consumer needs to know which query file backs which capability; (2) `ServiceResult`/`serviceFail`/`serviceOk` is the old functional error-handling style being replaced by `AppError` subclasses everywhere (`00-conventions-and-architecture.md` §7).

## Target file tree

```
packages/organization/
  package.json                          — deps: @deck-pack/db only
  src/
    domain/
      organization.ts                    — Organization entity (rich or anemic — see note below)
      errors.ts                          — OrganizationNotFoundError, OrganizationSlugConflictError, UserAlreadyInOrganizationError
    repositories/
      organization-repository.ts          — OrganizationRepository interface + DrizzleOrganizationRepository
      in-memory-organization-repository.ts — InMemoryOrganizationRepository, for unit tests
    use-cases/
      create-organization.ts               — class CreateOrganization
      list-organizations.ts
      get-organization.ts
      list-organization-members.ts
      update-organization.ts
      delete-organization.ts
      lookup-user-by-email.ts
    index.ts                                — exports: every use-case class, OrganizationRepository (type only), Organization, every error class
```

## What each file contains

| File                                                | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/organization.ts`                            | The `Organization` entity. Given this domain has no interesting invariants beyond "slug must be unique" (enforced at the DB layer) and no computed behavior, an anemic entity (a typed data holder) is appropriate — don't invent behavior it doesn't have just to look richer. See `00-conventions-and-architecture.md` for the anemic-vs-rich distinction; richer domains (see `packages/gallery.md`) get real behavior on the entity. |
| `domain/errors.ts`                                  | `OrganizationNotFoundError`, `OrganizationSlugConflictError`, `UserAlreadyInOrganizationError` — all `extends AppError`. Replaces the `serviceFail("not_found", ...)` / `serviceFail("conflict", ...)` string-tag pattern.                                                                                                                                                                                                               |
| `repositories/organization-repository.ts`           | `OrganizationRepository` interface (one method per current query function: `findById`, `list`, `create`, `update`, `delete`, `listMembers`, `findUserByEmail`) + `DrizzleOrganizationRepository implements OrganizationRepository`, which is what the current seven `packages/db/src/queries/*.ts` files collapse into as methods on one class.                                                                                          |
| `repositories/in-memory-organization-repository.ts` | `InMemoryOrganizationRepository` — in-memory `Map`-backed fake with a `.seed()` method, following the `InMemoryObjectStorage` pattern.                                                                                                                                                                                                                                                                                                   |
| `use-cases/create-organization.ts`                  | `class CreateOrganization { constructor(private repo: OrganizationRepository) {} async execute(input, actingUser) {...} }` — one class per current service method.                                                                                                                                                                                                                                                                       |
| `index.ts`                                          | Public surface: use-case classes + `Organization` + `OrganizationRepository` (as a type, for the container's constructor typing) + error classes. `DrizzleOrganizationRepository`/`InMemoryOrganizationRepository` are **not** re-exported from here — only `apps/api/src/container.ts` needs the concrete classes, and it imports them from the specific file, keeping the package's "public API surface" narrow.                       |

## Target code

`repositories/organization-repository.ts`:

```typescript
export interface OrganizationRepository {
  findUserByEmail(
    email: string,
  ): Promise<{ found: boolean; name?: string; email?: string; hasOrg?: boolean }>;
  list(): Promise<OrganizationSummary[]>;
  findById(organizationId: string): Promise<OrganizationDetail | null>;
  listMembers(organizationId: string): Promise<OrganizationMember[]>;
  create(
    input: CreateOrganizationInput,
  ): Promise<{ organizationId: string; userId: string; isNewUser: boolean }>;
  update(organizationId: string, input: UpdateOrganizationInput): Promise<OrganizationDetail>;
  delete(organizationId: string): Promise<void>;
}

export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly uow: UnitOfWork) {} // injected — see 00-conventions §10.2; same instance shared across every Repository in one AppContainer

  async findUserByEmail(email: string) {
    const db = this.uow.getDb();
    const row = await db.query.users.findFirst({ where: eq(users.email, email) });
    // ... maps row -> return shape, same logic packages/db/src/queries/findUserByEmail.ts had
  }

  async create(input: CreateOrganizationInput) {
    const db = this.uow.getDb();
    // ... same logic as createOrganizationWithOwner.ts, now a method instead of a standalone exported function
  }

  // ... one method per remaining query file
}
```

`use-cases/create-organization.ts`:

```typescript
export class CreateOrganization {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(
    input: CreateOrganizationInput,
  ): Promise<{ organizationId: string; userId: string; isNewUser: boolean }> {
    try {
      return await this.repo.create(input);
    } catch (error) {
      if (isSlugConflict(error)) throw new OrganizationSlugConflictError(input.slug);
      throw error;
    }
  }
}
```

`domain/errors.ts`:

```typescript
export class OrganizationNotFoundError extends AppError {
  readonly code = "ORGANIZATION_NOT_FOUND";
  readonly httpStatus = 404;
  constructor(organizationId: string) {
    super(`Organization ${organizationId} not found`);
  }
}

export class OrganizationSlugConflictError extends AppError {
  readonly code = "ORGANIZATION_SLUG_CONFLICT";
  readonly httpStatus = 409;
  constructor(slug: string) {
    super(`An organization with slug "${slug}" already exists`);
  }
}
```

## `apps/api/src/routers/organization-router.ts` (the consuming side)

```typescript
export function organizationRouter(container: AppContainer) {
  return router({
    create: protectedProcedure
      .input(createOrganizationInputSchema)
      .mutation(({ input }) =>
        new CreateOrganization(container.organizationRepository).execute(input),
      ),

    list: protectedProcedure.query(() =>
      new ListOrganizations(container.organizationRepository).execute(),
    ),

    delete: platformAdminProcedure
      .input(organizationIdSchema)
      .mutation(({ input }) =>
        new DeleteOrganization(container.organizationRepository).execute(input.organizationId),
      ),
  });
}
```

## Design patterns implemented here, and what each solves

| Pattern                                                      | File(s)                                   | Problem solved                                                                                                                                                                                                                              |
| ------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository**                                               | `repositories/organization-repository.ts` | Decouples use-cases from Drizzle/SQL; the seven previously-separate query _functions_ become methods on one class with one interface, so a use-case depends on "a thing that can look up organizations," not on seven specific file imports |
| **Use Case**                                                 | `use-cases/*.ts`                          | Each business operation is independently testable and constructor-injectable; replaces the single `createOrganizationService(deps)` mega-object with seven focused classes                                                                  |
| **Dependency Injection (constructor)**                       | every use-case's constructor              | `new CreateOrganization(repo)` — swap `DrizzleOrganizationRepository` for `InMemoryOrganizationRepository` with zero change to the use-case                                                                                                 |
| **Exception hierarchy** (replaces functional error handling) | `domain/errors.ts`                        | `throw new OrganizationSlugConflictError(slug)` replaces `return serviceFail("conflict", { message: "..." })` — errors are now typed classes the caller can `instanceof` check, not string tags                                             |

## Migration steps for this specific package

1. Create `packages/organization` with the file tree above; `package.json` depends only on `@deck-pack/db`.
2. Port each of the 7 query files (`createOrganizationWithOwner.ts`, `deleteOrganization.ts`, `findUserByEmail.ts`, `getOrganizationWithOwner.ts`, `listOrganizationMembers.ts`, `listOrganizationsWithOwner.ts`, `updateOrganization.ts`) into methods on `DrizzleOrganizationRepository` — same SQL/Drizzle logic, now grouped under one class.
3. Port each of the 7 service methods into their own use-case class, replacing `ServiceResult`/`serviceFail`/`serviceOk` with throwing the matching `AppError` subclass.
4. Write `InMemoryOrganizationRepository`, port (or write new) unit tests against it — these should run with zero DB.
5. Update `apps/api/src/trpc/router.ts` (or the new `routers/organization-router.ts`) to import from `@deck-pack/organization` instead of `../domains/organization/*`.
6. Delete `apps/api/src/domains/organization/`.
7. Add `organizationRepository` to `AppContainer` in all three factory methods (`production`, `forIntegrationTest`, `forUnitTest`) — `production()` passes the shared `unitOfWork` instance from `@deck-pack/db` into `new DrizzleOrganizationRepository(unitOfWork)`; `forIntegrationTest(db)` constructs and passes a fresh `new UnitOfWork(db)` instead (see 00-conventions §9.3/§10.2).
