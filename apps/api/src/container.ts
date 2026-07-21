import { unitOfWork, UnitOfWork, type Database } from "@deck-pack/db";
import { env } from "@deck-pack/env/server";
import type { BillingRepository } from "@deck-pack/billing";
import { InMemoryBillingRepository } from "@deck-pack/billing/repositories/in-memory-billing-repository";
import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";
import type { GalleryRepository } from "@deck-pack/gallery";
import { InMemoryGalleryRepository } from "@deck-pack/gallery/repositories/in-memory-gallery-repository";
import { DrizzleGalleryRepository } from "@deck-pack/gallery/repositories/gallery-repository";
import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { NounProjectClient } from "@deck-pack/integrations/noun-project";
import { PexelsClient } from "@deck-pack/integrations/pexels";
import type { InvitationPort, MembersRepository } from "@deck-pack/members";
import { InMemoryInvitationPort } from "@deck-pack/members/integrations/in-memory-invitation-port";
import { InMemoryMembersRepository } from "@deck-pack/members/repositories/in-memory-members-repository";
import { DrizzleMembersRepository } from "@deck-pack/members/repositories/members-repository";
import type { OrganizationRepository } from "@deck-pack/organization";
import { InMemoryOrganizationRepository } from "@deck-pack/organization/repositories/in-memory-organization-repository";
import { DrizzleOrganizationRepository } from "@deck-pack/organization/repositories/organization-repository";
import type { SeatsRepository } from "@deck-pack/seats";
import { InMemorySeatsRepository } from "@deck-pack/seats/repositories/in-memory-seats-repository";
import { DrizzleSeatsRepository } from "@deck-pack/seats/repositories/seats-repository";
import {
  createAzureObjectStorage,
  createMemoryObjectStorage,
  type ObjectStorage,
} from "@deck-pack/storage";
import type { UsageRepository } from "@deck-pack/usage";
import { InMemoryUsageRepository } from "@deck-pack/usage/repositories/in-memory-usage-repository";
import { DrizzleUsageRepository } from "@deck-pack/usage/repositories/usage-repository";
import type { UsersRepository } from "@deck-pack/users";
import { InMemoryUsersRepository } from "@deck-pack/users/repositories/in-memory-users-repository";
import { DrizzleUsersRepository } from "@deck-pack/users/repositories/users-repository";

import { createBetterAuthInvitationPort } from "./integrations/create-better-auth-invitation-port";
import type { AddinRouterDeps } from "./trpc/router";

export type AppContainerOverrides = Partial<{
  unitOfWork: UnitOfWork;
  organizationRepository: OrganizationRepository;
  usersRepository: UsersRepository;
  seatsRepository: SeatsRepository;
  membersRepository: MembersRepository;
  invitationPort: InvitationPort;
  billingRepository: BillingRepository;
  usageRepository: UsageRepository;
  galleryRepository: GalleryRepository;
  objectStorage: ObjectStorage;
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

function resolveObjectStorage(explicit?: ObjectStorage): ObjectStorage {
  if (explicit) return explicit;
  if (env.AZURE_STORAGE_ACCOUNT_NAME && env.AZURE_STORAGE_CONTAINER) {
    return createAzureObjectStorage({
      accountName: env.AZURE_STORAGE_ACCOUNT_NAME,
      containerName: env.AZURE_STORAGE_CONTAINER,
    });
  }
  return createMemoryObjectStorage();
}

export class AppContainer {
  constructor(
    public readonly unitOfWork: UnitOfWork,
    public readonly organizationRepository: OrganizationRepository,
    public readonly usersRepository: UsersRepository,
    public readonly seatsRepository: SeatsRepository,
    public readonly membersRepository: MembersRepository,
    public readonly invitationPort: InvitationPort,
    public readonly billingRepository: BillingRepository,
    public readonly usageRepository: UsageRepository,
    public readonly galleryRepository: GalleryRepository,
    public readonly objectStorage: ObjectStorage,
    public readonly brandfetchClient: BrandfetchClient,
    public readonly nounProjectClient: NounProjectClient,
    public readonly pexelsClient: PexelsClient,
  ) {}

  static production(): AppContainer {
    const storage = resolveObjectStorage();
    return new AppContainer(
      unitOfWork,
      new DrizzleOrganizationRepository(unitOfWork),
      new DrizzleUsersRepository(unitOfWork),
      new DrizzleSeatsRepository(unitOfWork),
      new DrizzleMembersRepository(unitOfWork),
      createBetterAuthInvitationPort(),
      new DrizzleBillingRepository(unitOfWork),
      new DrizzleUsageRepository(unitOfWork),
      new DrizzleGalleryRepository(unitOfWork),
      storage,
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
      new DrizzleUsersRepository(uow),
      new DrizzleSeatsRepository(uow),
      new DrizzleMembersRepository(uow),
      new InMemoryInvitationPort(),
      new DrizzleBillingRepository(uow),
      new DrizzleUsageRepository(uow),
      new DrizzleGalleryRepository(uow),
      createMemoryObjectStorage(),
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
      overrides.usersRepository ?? new InMemoryUsersRepository(),
      overrides.seatsRepository ?? new InMemorySeatsRepository(),
      overrides.membersRepository ?? new InMemoryMembersRepository(),
      overrides.invitationPort ?? new InMemoryInvitationPort(),
      overrides.billingRepository ?? new InMemoryBillingRepository(),
      overrides.usageRepository ?? new InMemoryUsageRepository(),
      overrides.galleryRepository ?? new InMemoryGalleryRepository(),
      overrides.objectStorage ?? createMemoryObjectStorage(),
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
      storage: this.objectStorage,
    };
  }
}
