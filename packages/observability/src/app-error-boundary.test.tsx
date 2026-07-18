import { render, screen } from "@testing-library/react";
import * as Sentry from "@sentry/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "./app-error-boundary";

vi.mock("@sentry/react", () => ({
  captureReactException: vi.fn(),
}));

function ThrowingChild(): never {
  throw new Error("Test render failure");
}

describe("AppErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports render errors to Sentry and shows fallback UI", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild />
      </AppErrorBoundary>,
    );

    expect(Sentry.captureReactException).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toContain("Something went wrong");
  });
});
