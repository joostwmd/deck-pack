export {
  createMicrosoftSignInStrategy,
  OfficeNaaMicrosoftSignInStrategy,
  WebMicrosoftSignInStrategy,
  type MicrosoftSignInResult,
  type MicrosoftSignInStrategy,
} from "./microsoft-sign-in-strategy";

export {
  getMicrosoftSignInAvailability,
  type MicrosoftSignInHost,
} from "./microsoft-sign-in-availability";

export {
  acquireMicrosoftTokens,
  acquireMicrosoftTokensSilently,
  checkNaaBrokerAvailable,
  initNestableMsal,
  isNestedAppAuthBridgePresent,
  resetNestableMsalInstance,
} from "./microsoft-naa";

export {
  ALLOW_SILENT_RESTORE,
  ContinuityAwareRestorePolicy,
  NoOpSessionContinuityStore,
  REQUIRE_EXPLICIT_SIGN_IN,
  markExplicitSignIn,
  markExplicitSignOut,
  type SessionContinuity,
  type SessionContinuityStore,
  type SessionRestorePolicy,
} from "./session-continuity";

export {
  MsalNestableTokenCache,
  type MicrosoftTokenCache,
} from "./microsoft-token-cache";

export {
  OfficeBearerSignOutStrategy,
  WebCookieSignOutStrategy,
  createSignOutStrategy,
  type BearerTokenStore,
  type SignOutStrategy,
} from "./sign-out-strategy";

export {
  ContinuityAwareSignInDecorator,
  withContinuityAwareSignIn,
} from "./continuity-aware-sign-in";
