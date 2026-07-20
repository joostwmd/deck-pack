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
} from "./microsoft-naa";
