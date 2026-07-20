/** Better Auth session cookie name for the unified `deckpack` cookie prefix. */
export function getSessionCookieName(baseURL: string): string {
  const secure = baseURL.startsWith("https://");
  return secure ? "__Secure-deckpack.session_token" : "deckpack.session_token";
}
