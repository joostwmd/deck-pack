export { IconNotFoundError, IconRateLimitError } from "./domain/errors";
export type {
  IconDetailsResponse,
  IconInsertPayload,
  IconListItem,
  IconSearchResponse,
  IconVariantItem,
} from "./domain/icon";

export type { IconIntegrationPort } from "./integrations/icon-integration-port";
export { NounProjectIconIntegration } from "./integrations/noun-project-icon-integration";
export { InMemoryIconIntegration } from "./integrations/in-memory-icon-integration";
export { mapIconDetailsResponse, mapIconSearchResponse } from "./integrations/mappers";

export { SearchIcons } from "./use-cases/search-icons";
export type { SearchIconsInput } from "./use-cases/search-icons";
export { GetIconDetails } from "./use-cases/get-icon-details";
export type { GetIconDetailsInput } from "./use-cases/get-icon-details";

export {
  iconDetailsResponseSchema,
  iconExternalIdSchema,
  iconSearchQuerySchema,
  iconSearchResponseSchema,
} from "./schemas";
