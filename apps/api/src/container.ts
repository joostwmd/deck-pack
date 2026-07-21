import { unitOfWork, UnitOfWork, type Database } from "@deck-pack/db";
import { env } from "@deck-pack/env/server";
import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { NounProjectClient } from "@deck-pack/integrations/noun-project";
import { PexelsClient } from "@deck-pack/integrations/pexels";
import type { OrganizationRepository } from "@deck-pack/organization";
import { InMemoryOrganizationRepository } from "@deck-pack/organization/repositories/in-memory-organization-repository";
import { DrizzleOrganizationRepository } from "@deck-pack/organization/repositories/organization-repository";

import type { AddinRouterDeps } from "./trpc/router";

export type AppContainerOverrides = Partial<{
  unitOfWork: UnitOfWork;
  organizationRepository: OrganizationRepository;
  brandfetchClient: BrandfetchClient;
  nounProjectClient: NounProjectClient;
  pexelsClient: PexelsClient;
}>;

const emptyBrandfetchClient = {
  searchBrands: async () => ({ results: [] }),
  getBrandDetails: async () => {
    throw new Error("Brand not found");
  },
} as unknown as BrandfetchClient;

const emptyNounProjectClient = {
  searchIcons: async () => ({ icons: [], generated_at: "", next_page: null, total: 0 }),
  getIconDetails: async () => {
    throw new Error("Icon not found");
  },
  resolveSvg: async () => null,
  downloadSvg: async () => "",
} as unknown as NounProjectClient;

const emptyPexelsClient = {
  searchPhotos: async () => ({
    page: 1,
    per_page: 0,
    photos: [],
    total_results: 0,
    next_page: null,
  }),
} as unknown as PexelsClient;

function createStubUnitOfWorkDb() {
  return {
    transaction: async <T>(fn: (tx: object) => Promise<T>) => fn({}),
  } as Database;
}

export class AppContainer {
  constructor(
    public readonly unitOfWork: UnitOfWork,
    public readonly organizationRepository: OrganizationRepository,
    public readonly brandfetchClient: BrandfetchClient,
    public readonly nounProjectClient: NounProjectClient,
    public readonly pexelsClient: PexelsClient,
  ) {}

  static production(): AppContainer {
    return new AppContainer(
      unitOfWork,
      new DrizzleOrganizationRepository(unitOfWork),
      new BrandfetchClient({
        apiKey: env.BRANDFETCH_API_KEY,
        clientId: env.BRANDFETCH_CLIENT_ID,
      }),
      new NounProjectClient({
        apiKey: env.NOUN_PROJECT_API_KEY,
        apiSecret: env.NOUN_PROJECT_API_SECRET,
      }),
      new PexelsClient(env.PEXELS_API_KEY),
    );
  }

  static forIntegrationTest(db: Database): AppContainer {
    const uow = new UnitOfWork(db);
    return new AppContainer(
      uow,
      new DrizzleOrganizationRepository(uow),
      emptyBrandfetchClient,
      emptyNounProjectClient,
      emptyPexelsClient,
    );
  }

  static forUnitTest(overrides: AppContainerOverrides = {}): AppContainer {
    const uow = overrides.unitOfWork ?? new UnitOfWork(createStubUnitOfWorkDb());
    return new AppContainer(
      uow,
      overrides.organizationRepository ?? new InMemoryOrganizationRepository(),
      overrides.brandfetchClient ?? emptyBrandfetchClient,
      overrides.nounProjectClient ?? emptyNounProjectClient,
      overrides.pexelsClient ?? emptyPexelsClient,
    );
  }

  toRouterDeps(): AddinRouterDeps {
    return {
      brandfetchApiKey: env.BRANDFETCH_API_KEY,
      brandfetchClientId: env.BRANDFETCH_CLIENT_ID,
      nounProjectApiKey: env.NOUN_PROJECT_API_KEY,
      nounProjectApiSecret: env.NOUN_PROJECT_API_SECRET,
      pexelsApiKey: env.PEXELS_API_KEY,
      brandfetch: this.brandfetchClient,
      nounProject: this.nounProjectClient,
      pexels: this.pexelsClient,
    };
  }
}
