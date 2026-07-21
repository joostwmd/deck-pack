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

import { ApiAppBuilder } from "@deck-pack/api/app-builder";
import { router, t } from "@deck-pack/api/api/setup";
import { trpcQuery } from "./test-utils/trpc-request";

const testRouter = router({
  ping: t.procedure.query(() => "pong"),
});

describe("ApiAppBuilder", () => {
  it("serves tRPC with only withTrpc and withErrorHandlers wired", async () => {
    const builder = new ApiAppBuilder();
    const app = builder.withTrpc(testRouter).withErrorHandlers().build();

    const { status, body } = await trpcQuery<string>(app, "ping", undefined);

    expect(status).toBe(200);
    expect(body.result?.data?.json).toBe("pong");
    expect(builder.testState().corsEnabled).toBe(false);
    expect(builder.testState().monitoringEnabled).toBe(false);
  });

  it("does not add CORS headers when withCors is omitted", async () => {
    const app = new ApiAppBuilder().withTrpc(testRouter).withErrorHandlers().build();

    const response = await app.request("/trpc/ping");

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
