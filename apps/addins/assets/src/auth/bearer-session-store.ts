let bearerToken: string | null = null;

export function getBearerToken(): string | null {
  return bearerToken;
}

export function setBearerToken(token: string): void {
  bearerToken = token;
}

export function clearBearerToken(): void {
  bearerToken = null;
}
