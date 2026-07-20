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
  process.env.BRANDFETCH_API_KEY ??= "test-integration-brandfetch-key";
  process.env.BRANDFETCH_CLIENT_ID ??= "test-integration-brandfetch-client";
  process.env.NODE_ENV ??= "test";
});

import { corsMiddleware, applyCorsToResponse } from "@deck-pack/api/transport/security";

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

  it("adds allow-origin after handlers that return a raw Response", async () => {
    const origin = process.env.CORS_ORIGINS!.split(",")[0]!.trim();
    const app = new Hono();
    app.use("*", corsMiddleware);
    app.get("/raw", () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await app.request("/raw", {
      headers: { Origin: origin },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("applyCorsToResponse adds allow-origin for trusted origins", () => {
    const origin = process.env.CORS_ORIGINS!.split(",")[0]!.trim();
    const wrapped = applyCorsToResponse(
      origin,
      new Response(JSON.stringify(null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(wrapped.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(wrapped.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(wrapped.headers.get("Access-Control-Expose-Headers")).toContain("set-auth-token");
  });
});
