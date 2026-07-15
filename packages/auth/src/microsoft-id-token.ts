import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTVerifyGetKey } from "jose";

const MICROSOFT_AUTHORITY = "https://login.microsoftonline.com";
const MICROSOFT_COMMON_JWKS_URL = new URL(`${MICROSOFT_AUTHORITY}/common/discovery/v2.0/keys`);

export interface MicrosoftIdTokenVerifierOptions {
  clientId: string;
  /**
   * Injectable for deterministic tests. Production uses Microsoft's cached
   * remote JWKS resolver, which also handles signing-key rotation.
   */
  keyResolver?: JWTVerifyGetKey;
}

/**
 * Better Auth 1.5.5's Microsoft verifier imports the selected JWK with its
 * optional `alg` property. Microsoft's common JWKS omits that property, so use
 * jose's remote JWKS resolver and pin the accepted token algorithm here.
 */
export function createMicrosoftIdTokenVerifier({
  clientId,
  keyResolver = createRemoteJWKSet(MICROSOFT_COMMON_JWKS_URL),
}: MicrosoftIdTokenVerifierOptions) {
  return async (token: string, nonce: string | undefined): Promise<boolean> => {
    try {
      const unverifiedClaims = decodeJwt(token);
      if (typeof unverifiedClaims.tid !== "string" || unverifiedClaims.tid.length === 0) {
        return false;
      }

      const issuer = `${MICROSOFT_AUTHORITY}/${unverifiedClaims.tid}/v2.0`;
      const { payload } = await jwtVerify(token, keyResolver, {
        algorithms: ["RS256"],
        audience: clientId,
        issuer,
        maxTokenAge: "1h",
      });

      return nonce === undefined || payload.nonce === nonce;
    } catch {
      return false;
    }
  };
}
