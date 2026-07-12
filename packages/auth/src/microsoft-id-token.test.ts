import { generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import { createMicrosoftIdTokenVerifier } from "./microsoft-id-token";

const CLIENT_ID = "microsoft-client-id";
const TENANT_ID = "tenant-123";
const ISSUER = `https://login.microsoftonline.com/${TENANT_ID}/v2.0`;
const NONCE = "expected-nonce";
type GeneratedKeyPair = Awaited<ReturnType<typeof generateKeyPair>>;

describe("createMicrosoftIdTokenVerifier", () => {
  let keyPair: GeneratedKeyPair;

  beforeAll(async () => {
    keyPair = await generateKeyPair("RS256");
  });

  async function signToken(
    claims: Record<string, unknown> = {},
    options: {
      algorithm?: string;
      audience?: string;
      issuer?: string;
      signingKey?: GeneratedKeyPair["privateKey"];
    } = {},
  ) {
    const algorithm = options.algorithm ?? "RS256";

    return new SignJWT({
      tid: TENANT_ID,
      nonce: NONCE,
      ...claims,
    })
      .setProtectedHeader({ alg: algorithm, kid: "test-key" })
      .setIssuer(options.issuer ?? ISSUER)
      .setAudience(options.audience ?? CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(options.signingKey ?? keyPair.privateKey);
  }

  function createVerifier(key: GeneratedKeyPair["publicKey"] = keyPair.publicKey) {
    return createMicrosoftIdTokenVerifier({
      clientId: CLIENT_ID,
      keyResolver: async () => key,
    });
  }

  it("accepts a valid tenant-issued RS256 token", async () => {
    await expect(createVerifier()(await signToken(), NONCE)).resolves.toBe(true);
  });

  it("rejects a token for another audience", async () => {
    const token = await signToken({}, { audience: "another-client" });

    await expect(createVerifier()(token, NONCE)).resolves.toBe(false);
  });

  it("rejects an issuer that does not match the token tenant", async () => {
    const token = await signToken({}, { issuer: "https://login.microsoftonline.com/other/v2.0" });

    await expect(createVerifier()(token, NONCE)).resolves.toBe(false);
  });

  it("rejects a nonce mismatch but permits an omitted expected nonce", async () => {
    const token = await signToken();
    const verify = createVerifier();

    await expect(verify(token, "wrong-nonce")).resolves.toBe(false);
    await expect(verify(token, undefined)).resolves.toBe(true);
  });

  it("rejects a token signed with a different key", async () => {
    const { privateKey: otherPrivateKey } = await generateKeyPair("RS256");
    const token = await signToken({}, { signingKey: otherPrivateKey });

    await expect(createVerifier()(token, NONCE)).resolves.toBe(false);
  });

  it("rejects algorithms other than RS256", async () => {
    const secret = new TextEncoder().encode("a-secret-long-enough-for-hs256");
    const token = await new SignJWT({ tid: TENANT_ID, nonce: NONCE })
      .setProtectedHeader({ alg: "HS256", kid: "test-key" })
      .setIssuer(ISSUER)
      .setAudience(CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    await expect(createVerifier()(token, NONCE)).resolves.toBe(false);
  });
});
