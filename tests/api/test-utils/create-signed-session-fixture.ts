import { serializeSignedCookie } from "better-call";
import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";

export type SignedSessionFixture = {
  userId: string;
  email: string;
  cookieHeader: string;
  bearerToken: string;
};

export async function createSignedSessionFixture(args: {
  cookieName?: string;
  emailPrefix: string;
}): Promise<SignedSessionFixture> {
  const db = createDb();
  const userId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const sessionToken = crypto.randomUUID();
  const email = `${args.emailPrefix}-${userId}@test.local`;
  const cookieName = args.cookieName ?? "deckpack.session_token";

  await db.insert(user).values({
    id: userId,
    name: "Session User",
    email,
    emailVerified: true,
  });

  await db.insert(session).values({
    id: sessionId,
    userId,
    token: sessionToken,
    expiresAt: new Date(Date.now() + 86_400_000),
  });

  const cookieHeader = await serializeSignedCookie(
    cookieName,
    sessionToken,
    process.env.BETTER_AUTH_SECRET!,
  );
  const bearerToken = cookieHeader.split("=").slice(1).join("=");

  return { userId, email, cookieHeader, bearerToken };
}
