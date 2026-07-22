import { markExplicitSignIn, type SessionContinuityStore } from "./session-continuity";
import type {
  MicrosoftSignInResult,
  MicrosoftSignInStrategy,
} from "./microsoft-sign-in-strategy";

export class ContinuityAwareSignInDecorator implements MicrosoftSignInStrategy {
  constructor(
    private readonly inner: MicrosoftSignInStrategy,
    private readonly continuityStore: SessionContinuityStore,
  ) {}

  async signIn(): Promise<MicrosoftSignInResult> {
    const result = await this.inner.signIn();

    if (result.ok) {
      markExplicitSignIn(this.continuityStore);
    }

    return result;
  }
}

export function withContinuityAwareSignIn(
  strategy: MicrosoftSignInStrategy,
  continuityStore: SessionContinuityStore,
): MicrosoftSignInStrategy {
  return new ContinuityAwareSignInDecorator(strategy, continuityStore);
}
