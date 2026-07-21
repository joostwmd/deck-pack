export const AUTHENTICATION_REQUIRED_MESSAGE = "Authentication required";
export const QUOTA_EXCEEDED_MESSAGE = "Limit reached — upgrade your plan!";

type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null;
}

function hasQuotaExceededCode(value: unknown): boolean {
  return typeof value === "string" && value === "quota_exceeded";
}

function classifyQuotaExceededError(error: unknown, seen: Set<object>): boolean {
  if (typeof error === "string") {
    return /insert limit reached/i.test(error) || /quota_exceeded/i.test(error);
  }

  if (!isRecord(error) || seen.has(error)) {
    return false;
  }

  seen.add(error);

  if (hasQuotaExceededCode(error.code) || hasQuotaExceededCode(error.reason)) {
    return true;
  }

  if (typeof error.message === "string" && /insert limit reached/i.test(error.message)) {
    return true;
  }

  return [error.data, error.shape, error.meta, error.response, error.cause].some((value) =>
    classifyQuotaExceededError(value, seen),
  );
}

export function isQuotaExceededError(error: unknown): boolean {
  return classifyQuotaExceededError(error, new Set<object>());
}

function hasUnauthorizedCode(value: unknown): boolean {
  return typeof value === "string" && value.toUpperCase() === "UNAUTHORIZED";
}

function hasUnauthorizedStatus(value: unknown): boolean {
  return value === 401 || value === "401";
}

function classifyAuthenticationError(error: unknown, seen: Set<object>): boolean {
  if (!isRecord(error) || seen.has(error)) {
    return false;
  }

  seen.add(error);

  if (
    hasUnauthorizedCode(error.code) ||
    hasUnauthorizedStatus(error.status) ||
    hasUnauthorizedStatus(error.statusCode) ||
    hasUnauthorizedStatus(error.httpStatus)
  ) {
    return true;
  }

  if (
    typeof error.message === "string" &&
    (/\bUNAUTHORIZED\b/i.test(error.message) || /\b401 Unauthorized\b/i.test(error.message))
  ) {
    return true;
  }

  return [error.data, error.shape, error.meta, error.response, error.cause].some((value) =>
    classifyAuthenticationError(value, seen),
  );
}

export function isAuthenticationError(error: unknown): boolean {
  return classifyAuthenticationError(error, new Set<object>());
}

export function getUserFacingApiErrorMessage(error: unknown, fallback: string): string {
  if (isAuthenticationError(error)) {
    return AUTHENTICATION_REQUIRED_MESSAGE;
  }

  if (isQuotaExceededError(error)) {
    return QUOTA_EXCEEDED_MESSAGE;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
