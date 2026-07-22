import { unitOfWork, UnitOfWork, type Database } from "@deck-pack/db";
import { env } from "@deck-pack/env/server";
import type { BillingRepository } from "@deck-pack/billing";
import { InMemoryBillingRepository } from "@deck-pack/billing/repositories/in-memory-billing-repository";
import { DrizzleBillingRepository } from "@deck-pack/billing/repositories/billing-repository";
import type { BrandProfilesRepository } from "@deck-pack/brand-profiles";
import { InMemoryBrandProfilesRepository } from "@deck-pack/brand-profiles/repositories/in-memory-brand-profiles-repository";
import { DrizzleBrandProfilesRepository } from "@deck-pack/brand-profiles/repositories/brand-profiles-repository";
import type { GalleryRepository } from "@deck-pack/gallery";
import { InMemoryGalleryRepository } from "@deck-pack/gallery/repositories/in-memory-gallery-repository";
import { DrizzleGalleryRepository } from "@deck-pack/gallery/repositories/gallery-repository";
import { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import { NounProjectClient } from "@deck-pack/integrations/noun-project";
import { PexelsClient } from "@deck-pack/integrations/pexels";
import type { IconIntegrationPort } from "@deck-pack/icons";
import { InMemoryIconIntegration } from "@deck-pack/icons/integrations/in-memory-icon-integration";
import { NounProjectIconIntegration } from "@deck-pack/icons/integrations/noun-project-icon-integration";
import type { LogoIntegrationPort } from "@deck-pack/logos";
import { BrandfetchLogoIntegration } from "@deck-pack/logos/integrations/brandfetch-logo-integration";
import { InMemoryLogoIntegration } from "@deck-pack/logos/integrations/in-memory-logo-integration";
import type { InvitationPort, MembersRepository } from "@deck-pack/members";
import { InMemoryInvitationPort } from "@deck-pack/members/integrations/in-memory-invitation-port";
import { InMemoryMembersRepository } from "@deck-pack/members/repositories/in-memory-members-repository";
import { DrizzleMembersRepository } from "@deck-pack/members/repositories/members-repository";
import type { OrganizationRepository } from "@deck-pack/organization";
import { InMemoryOrganizationRepository } from "@deck-pack/organization/repositories/in-memory-organization-repository";
import { DrizzleOrganizationRepository } from "@deck-pack/organization/repositories/organization-repository";
import type { PhotoIntegrationPort } from "@deck-pack/photos";
import { InMemoryPhotoIntegration } from "@deck-pack/photos/integrations/in-memory-photo-integration";
import { PexelsPhotoIntegration } from "@deck-pack/photos/integrations/pexels-photo-integration";
import type { AgendaServiceRepository } from "@deck-pack/agenda-service";
import { InMemoryAgendaServiceRepository } from "@deck-pack/agenda-service/repositories/in-memory-agenda-service-repository";
import { DrizzleAgendaServiceRepository } from "@deck-pack/agenda-service/repositories/agenda-service-repository";
import type { SeatsRepository } from "@deck-pack/seats";
import { InMemorySeatsRepository } from "@deck-pack/seats/repositories/in-memory-seats-repository";
import { DrizzleSeatsRepository } from "@deck-pack/seats/repositories/seats-repository";
import type { ShortcutOverridesRepository } from "@deck-pack/shortcut-overrides";
import { InMemoryShortcutOverridesRepository } from "@deck-pack/shortcut-overrides/repositories/in-memory-shortcut-overrides-repository";
import { DrizzleShortcutOverridesRepository } from "@deck-pack/shortcut-overrides/repositories/shortcut-overrides-repository";
import { AzureObjectStorage, InMemoryObjectStorage, type ObjectStorage } from "@deck-pack/storage";
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
  brandProfilesRepository: BrandProfilesRepository;
  agendaServiceRepository: AgendaServiceRepository;
  shortcutOverridesRepository: ShortcutOverridesRepository;
  objectStorage: ObjectStorage;
  brandfetchClient: BrandfetchClient;
  logoIntegration: LogoIntegrationPort;
  nounProjectClient: NounProjectClient;
  iconIntegration: IconIntegrationPort;
  pexelsClient: PexelsClient;
  photoIntegration: PhotoIntegrationPort;
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
    return new AzureObjectStorage({
      accountName: env.AZURE_STORAGE_ACCOUNT_NAME,
      containerName: env.AZURE_STORAGE_CONTAINER,
    });
  }
  return new InMemoryObjectStorage();
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
    public readonly brandProfilesRepository: BrandProfilesRepository,
    public readonly agendaServiceRepository: AgendaServiceRepository,
    public readonly shortcutOverridesRepository: ShortcutOverridesRepository,
    public readonly objectStorage: ObjectStorage,
    public readonly brandfetchClient: BrandfetchClient,
    public readonly logoIntegration: LogoIntegrationPort,
    public readonly nounProjectClient: NounProjectClient,
    public readonly iconIntegration: IconIntegrationPort,
    public readonly pexelsClient: PexelsClient,
    public readonly photoIntegration: PhotoIntegrationPort,
  ) {}

  static production(): AppContainer {
    const storage = resolveObjectStorage();
    const brandfetchClient = new BrandfetchClient({
      apiKey: env.BRANDFETCH_API_KEY,
      clientId: env.BRANDFETCH_CLIENT_ID,
    });
    const nounProjectClient = new NounProjectClient({
      apiKey: env.NOUN_PROJECT_API_KEY,
      apiSecret: env.NOUN_PROJECT_API_SECRET,
    });
    const pexelsClient = new PexelsClient(env.PEXELS_API_KEY);
    const billing = new DrizzleBillingRepository(unitOfWork);
    const organization = new DrizzleOrganizationRepository(unitOfWork, billing);
    const members = new DrizzleMembersRepository(unitOfWork, billing, organization);
    const seats = new DrizzleSeatsRepository(unitOfWork, billing, organization);
    const usage = new DrizzleUsageRepository(unitOfWork, billing);
    return new AppContainer(
      unitOfWork,
      organization,
      new DrizzleUsersRepository(unitOfWork),
      seats,
      members,
      createBetterAuthInvitationPort(),
      billing,
      usage,
      new DrizzleGalleryRepository(unitOfWork),
      new DrizzleBrandProfilesRepository(unitOfWork),
      new DrizzleAgendaServiceRepository(unitOfWork),
      new DrizzleShortcutOverridesRepository(unitOfWork),
      storage,
      brandfetchClient,
      new BrandfetchLogoIntegration(brandfetchClient),
      nounProjectClient,
      new NounProjectIconIntegration(nounProjectClient),
      pexelsClient,
      new PexelsPhotoIntegration(pexelsClient),
    );
  }

  static forIntegrationTest(db: Database): AppContainer {
    const uow = new UnitOfWork(db);
    const billing = new DrizzleBillingRepository(uow);
    const organization = new DrizzleOrganizationRepository(uow, billing);
    const members = new DrizzleMembersRepository(uow, billing, organization);
    const seats = new DrizzleSeatsRepository(uow, billing, organization);
    const usage = new DrizzleUsageRepository(uow, billing);
    return new AppContainer(
      uow,
      organization,
      new DrizzleUsersRepository(uow),
      seats,
      members,
      new InMemoryInvitationPort(),
      billing,
      usage,
      new DrizzleGalleryRepository(uow),
      new DrizzleBrandProfilesRepository(uow),
      new DrizzleAgendaServiceRepository(uow),
      new DrizzleShortcutOverridesRepository(uow),
      new InMemoryObjectStorage(),
      emptyBrandfetchClient,
      new BrandfetchLogoIntegration(emptyBrandfetchClient),
      emptyNounProjectClient,
      new NounProjectIconIntegration(emptyNounProjectClient),
      emptyPexelsClient,
      new PexelsPhotoIntegration(emptyPexelsClient),
    );
  }

  static forUnitTest(overrides: AppContainerOverrides = {}): AppContainer {
    const uow = overrides.unitOfWork ?? new UnitOfWork(createStubUnitOfWorkDb());
    const billing = overrides.billingRepository ?? new InMemoryBillingRepository();
    const organization =
      overrides.organizationRepository ?? new InMemoryOrganizationRepository(billing);
    const members =
      overrides.membersRepository ?? new InMemoryMembersRepository(billing, organization);
    const seats = overrides.seatsRepository ?? new InMemorySeatsRepository(billing, organization);
    const usage = overrides.usageRepository ?? new InMemoryUsageRepository(billing);
    return new AppContainer(
      uow,
      organization,
      overrides.usersRepository ?? new InMemoryUsersRepository(),
      seats,
      members,
      overrides.invitationPort ?? new InMemoryInvitationPort(),
      billing,
      usage,
      overrides.galleryRepository ?? new InMemoryGalleryRepository(),
      overrides.brandProfilesRepository ?? new InMemoryBrandProfilesRepository(),
      overrides.agendaServiceRepository ?? new InMemoryAgendaServiceRepository(),
      overrides.shortcutOverridesRepository ?? new InMemoryShortcutOverridesRepository(),
      overrides.objectStorage ?? new InMemoryObjectStorage(),
      overrides.brandfetchClient ?? emptyBrandfetchClient,
      overrides.logoIntegration ?? new InMemoryLogoIntegration(),
      overrides.nounProjectClient ?? emptyNounProjectClient,
      overrides.iconIntegration ?? new InMemoryIconIntegration(),
      overrides.pexelsClient ?? emptyPexelsClient,
      overrides.photoIntegration ?? new InMemoryPhotoIntegration(),
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
