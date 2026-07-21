import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import { seedApiTestEnv } from "../test-utils/seed-api-test-env";

vi.hoisted(() => {
  seedApiTestEnv();
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
    app.get(
      "/raw",
      () =>
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
