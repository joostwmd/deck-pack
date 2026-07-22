# `packages/db` — infra package

Kind: **infra** (per `00-conventions-and-architecture.md` §8.1) — framework/tooling glue. Unlike other infra packages, `db` legitimately owns a large `queries/` folder today because that's its entire historical purpose; the refactor's job is to change _who's allowed to import it_, not to gut its contents.

## Current state (confirmed)

```
packages/db/src/
  migrations/         (+ migrations/meta/)
  queries/            — 62 files, one per query (createOrganizationWithOwner.ts, findUserByEmail.ts, libraryAdmin.ts, ...)
  schema/             — Drizzle table definitions
  test-utils/
  transaction.ts       — the `tx` Proxy + withTransaction()
  index.ts
  org-metadata.ts
  library-catalog.ts    — → renamed gallery-catalog.ts, see packages/gallery.md
```

62 query files is the concrete evidence for why package-per-domain (§3.1) is worth the ceremony: today, nothing stops `apps/api/src/domains/library/service.ts` from importing `apps/api/src/domains/organization`'s query files, because they're all equally reachable, flat, undifferentiated exports from one big `@deck-pack/db/queries/*` surface. After the refactor, those 62 files become methods distributed across ~10-15 domain-owned `Drizzle<Domain>Repository` classes, and `packages/db` itself is imported only by domain packages' `repositories/`/`integrations/` folders — never by `apps/api` directly, never by another domain package.

## Target file tree

```
packages/db/src/
  migrations/
  queries/            — DELETED once every query is migrated into a domain package's Drizzle*Repository
  schema/             — stays here; schema definitions are legitimately shared, every domain's Repository imports the tables it needs
  test-utils/          — extended: createPgliteTestDb() helper (see 00-conventions §9.2)
  transaction.ts        — rewritten as the `UnitOfWork` class, see below
  index.ts              — exports `db` (the raw Drizzle connection) and `unitOfWork` (the single production `UnitOfWork` instance)
  org-metadata.ts
```

## The one required code change: `transaction.ts`

Current code (confirmed, in full):

```typescript
export const tx = new Proxy({} as Transaction, {
  get(_target, prop) {
    const activeTransaction = transactionStorage.getStore();
    if (activeTransaction) return activeTransaction[prop as keyof Transaction];
    if (prop === "transaction") return db.transaction.bind(db);
    if (prop === "rollback" || prop === "setTransaction") {
      return () => {
        throw new Error(`${String(prop)} can only be called within an active transaction`);
      };
    }
    return (db as any)[prop];
  },
});

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const activeTransaction = transactionStorage.getStore();
  if (activeTransaction) return fn();
  return db.transaction(async (transaction) => transactionStorage.run(transaction, fn));
}
```

Two concrete problems this has, both stated by the person doing the refactor during the discussion: (1) it's a `Proxy` with a `get` trap that special-cases three property names and falls through to `(db as any)[prop]` for everything else — a reader has to run the trap logic mentally for every property access to know what they're actually calling; (2) `withTransaction` has no way to request an isolation level, which matters the moment any domain (see `packages/domain-template.md`'s `seats` note on "last seat" races) needs `serializable`.

Target code — a class, not a pair of free functions, so it's constructor-injectable like every other dependency (00-conventions §10.2 has the full rationale, matching the `Saga` pattern's reasoning):

```typescript
export type TransactionOptions = {
  isolationLevel?: "read committed" | "repeatable read" | "serializable";
};

export class UnitOfWork {
  private readonly transactionStorage = new AsyncLocalStorage<Transaction>();

  constructor(private readonly db: Database) {}

  /** The current transaction if one is active on this async context, otherwise the base connection. */
  getDb(): Transaction | Database {
    return this.transactionStorage.getStore() ?? this.db;
  }

  async withTransaction<T>(fn: () => Promise<T>, options?: TransactionOptions): Promise<T> {
    const active = this.transactionStorage.getStore();
    if (active) {
      if (options?.isolationLevel) {
        throw new Error("Cannot request an isolation level for a transaction already in progress");
      }
      return fn();
    }
    return this.db.transaction(
      (transaction) => this.transactionStorage.run(transaction, fn),
      options?.isolationLevel ? { isolationLevel: options.isolationLevel } : undefined,
    );
  }
}
```

`index.ts` exports exactly one production instance:

```typescript
// packages/db/src/index.ts
export const db = drizzle(pool, { schema });
export const unitOfWork = new UnitOfWork(db);
```

Every Repository takes a `UnitOfWork` in its constructor and calls `this.uow.getDb()` explicitly instead of calling a module-level function:

```typescript
export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly uow: UnitOfWork) {}

  async findById(id: string): Promise<Organization | null> {
    const db = this.uow.getDb();
    const row = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    return row ? mapRowToOrganization(row) : null;
  }
}
```

No more `Proxy`, no more implicit fallthrough, and no more hidden module-level singleton — `AppContainer.production()` gets `new DrizzleOrganizationRepository(unitOfWork)` (the shared production instance), while `AppContainer.forIntegrationTest(db)` constructs a **fresh** `new UnitOfWork(pgliteDb)` and passes that instead, so tests never share transaction state with production (see 00-conventions §9.3 and §10.2 for the lifetime distinction versus `Saga`).

## `test-utils/` addition

```typescript
// packages/db/src/test-utils/create-pglite-test-db.ts
export async function createPgliteTestDb(): Promise<PgliteDatabase> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/migrations" }); // same migrations that run against real Postgres
  return db;
}
```

This is what makes `AppContainer.forIntegrationTest()` (see `00-conventions-and-architecture.md` §9.3) possible without a real Postgres connection.

## Design patterns implemented here, and what each solves

| Pattern                                                    | File(s)                                                                                              | Problem solved                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository** (consumed here, defined in domain packages) | n/a — `db` provides the raw client/schema; domain packages provide the Repository abstraction on top | `db` stays a pure infra package with no business-shaped abstractions of its own — it's Drizzle + schema + transaction plumbing, nothing else                                                                                                                                                                                                             |
| **Unit of Work**                                           | `transaction.ts` (`UnitOfWork` class)                                                                | Tracks the current transaction via `AsyncLocalStorage` and exposes `getDb()`/`withTransaction()` on an injectable object; lets nested Repository calls automatically join an in-progress transaction without passing a transaction handle through every function signature, and lets tests supply a PGlite-backed instance instead of the production one |

## Migration order

1. Rewrite `transaction.ts` (`tx` Proxy → `UnitOfWork` class + `TransactionOptions`) as an isolated, low-risk commit — this is a mechanical, well-tested change that every future domain-package migration depends on. Do this **first**, before any domain extraction. Export the single production `unitOfWork` instance from `index.ts` alongside `db`.
2. Add `createPgliteTestDb()` to `test-utils/`.
3. As each domain package is created (see `packages/organization.md` and friends), move that domain's query files out of `queries/` into the new `Drizzle<Domain>Repository`, giving each Repository a `constructor(private readonly uow: UnitOfWork) {}` and updating call sites to `this.uow.getDb()`. Wire the shared `unitOfWork` into each Repository via `AppContainer.production()` (00-conventions §9.3).
4. Once `queries/` is empty, delete the folder and remove `@deck-pack/db/queries/*` from every package/app's allowed imports except domain packages' own `repositories/`.
