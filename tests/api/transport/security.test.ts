import { Hono } from "hono";
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
  process.env.PEXELS_API_KEY ??= "test-integration-pexels-key";
  process.env.NODE_ENV ??= "test";
});

import { corsMiddleware } from "@deck-pack/api/transport/security";

describe("corsMiddleware", () => {
  it("exposes set-auth-token for bearer session capture", async () => {
    const app = new Hono();
    app.use("*", corsMiddleware);
    app.get("/test", (c) => c.text("ok"));

    const response = await app.request("/test", {
      headers: {
        Origin: process.env.CORS_ORIGINS!.split(",")[0]!.trim(),
      },
    });

    expect(response.headers.get("Access-Control-Expose-Headers")).toContain("set-auth-token");
    expect(response.headers.get("Access-Control-Expose-Headers")).toContain("X-Request-Id");
  });
});
