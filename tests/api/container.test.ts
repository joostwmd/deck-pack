import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL ??= "postgresql://postgres:password@127.0.0.1:5432/deck-pack";
  process.env.BETTER_AUTH_SECRET ??= "test-integration-secret-placeholder-32-characters-min";
  process.env.BETTER_AUTH_URL ??= "http://127.0.0.1:3000";
  process.env.CORS_ORIGINS ??= "http://127.0.0.1:5173";
  process.env.OPS_ORIGINS ??= "http://127.0.0.1:5173";
  process.env.OPS_SIGNUP_EMAIL_DOMAIN ??= "code.berlin";
  process.env.EMAIL_API_KEY ??= "test-integration-key";
  process.env.EMAIL_FROM ??= "integration@test.local";
  process.env.PORTAL_APP_URL ??= "http://127.0.0.1:5174";
  process.env.PEXELS_API_KEY ??= "test-integration-pexels-key";
  process.env.BRANDFETCH_API_KEY ??= "test-integration-brandfetch-key";
  process.env.BRANDFETCH_CLIENT_ID ??= "test-integration-brandfetch-client";
  process.env.NOUN_PROJECT_API_KEY ??= "test-integration-noun-project-key";
  process.env.NOUN_PROJECT_API_SECRET ??= "test-integration-noun-project-secret";
  process.env.NODE_ENV ??= "test";
});

import { AppContainer } from "@deck-pack/api/container";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { createPgliteTestDb } from "@deck-pack/db/test-utils/create-pglite-test-db";

describe("AppContainer", () => {
  it("forUnitTest provides in-memory integration clients", () => {
    const container = AppContainer.forUnitTest();

    expect(container.unitOfWork).toBeInstanceOf(UnitOfWork);
    expect(container.organizationRepository).toBeDefined();
    expect(container.usersRepository).toBeDefined();
    expect(container.seatsRepository).toBeDefined();
    expect(container.membersRepository).toBeDefined();
    expect(container.invitationPort).toBeDefined();
    expect(container.billingRepository).toBeDefined();
    expect(container.usageRepository).toBeDefined();
    expect(container.brandfetchClient).toBeDefined();
    expect(container.nounProjectClient).toBeDefined();
    expect(container.pexelsClient).toBeDefined();
  });

  it("forIntegrationTest binds UnitOfWork to the supplied database", async () => {
    const db = await createPgliteTestDb();
    const container = AppContainer.forIntegrationTest(db);

    expect(container.unitOfWork.getDb()).toBe(db);
    expect(container.organizationRepository).toBeDefined();
  });

  it("forUnitTest accepts overrides", async () => {
    const db = await createPgliteTestDb();
    const customUnitOfWork = new UnitOfWork(db);
    const container = AppContainer.forUnitTest({ unitOfWork: customUnitOfWork });

    expect(container.unitOfWork).toBe(customUnitOfWork);
  });
});
