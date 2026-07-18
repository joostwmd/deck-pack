import type { AssetDetailsResponse, AssetListItem } from "@/types/asset-types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createDetails(
  item: AssetListItem,
  variantLabels: string[],
): AssetDetailsResponse {
  return {
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    metadata: { id: item.id },
    variants: variantLabels.map((label, index) => ({
      id: `${item.id}-variant-${index}`,
      name: label,
      imageUrl: item.imageUrl,
      insert: { type: "image" as const, imageUrl: item.imageUrl },
    })),
  };
}

export const mockFlagResults: AssetListItem[] = [
  { id: "flag-nl", name: "Netherlands", imageUrl: "https://flagcdn.com/w80/nl.png" },
  { id: "flag-de", name: "Germany", imageUrl: "https://flagcdn.com/w80/de.png" },
  { id: "flag-fr", name: "France", imageUrl: "https://flagcdn.com/w80/fr.png" },
];

const mockFlagDetailsById: Record<string, AssetDetailsResponse> = Object.fromEntries(
  mockFlagResults.map((item) => [item.id, createDetails(item, ["4:3", "1:1"])]),
);

export async function mockFlagSearch(query: string): Promise<AssetListItem[]> {
  await delay(300);
  if (!query.trim()) return [];
  const normalized = query.toLowerCase();
  return mockFlagResults.filter((item) => item.name.toLowerCase().includes(normalized));
}

export async function mockFlagDetails(id: string): Promise<AssetDetailsResponse> {
  await delay(400);
  const details = mockFlagDetailsById[id];
  if (!details) throw new Error(`Flag not found: ${id}`);
  return details;
}

export const mockLogoResults: AssetListItem[] = [
  { id: "logo-acme", name: "Acme Corp", imageUrl: "https://placehold.co/80x80/png?text=A" },
  { id: "logo-deck", name: "Deck Pack", imageUrl: "https://placehold.co/80x80/png?text=D" },
];

const mockLogoDetailsById: Record<string, AssetDetailsResponse> = Object.fromEntries(
  mockLogoResults.map((item) => [item.id, createDetails(item, ["Full color", "Monochrome"])]),
);

export async function mockLogoSearch(query: string): Promise<AssetListItem[]> {
  await delay(300);
  if (!query.trim()) return [];
  const normalized = query.toLowerCase();
  return mockLogoResults.filter((item) => item.name.toLowerCase().includes(normalized));
}

export async function mockLogoDetails(id: string): Promise<AssetDetailsResponse> {
  await delay(400);
  const details = mockLogoDetailsById[id];
  if (!details) throw new Error(`Logo not found: ${id}`);
  return details;
}

export const mockIconResults: AssetListItem[] = [
  { id: "icon-arrow", name: "Arrow right", imageUrl: "https://placehold.co/80x80/png?text=->" },
  { id: "icon-star", name: "Star", imageUrl: "https://placehold.co/80x80/png?text=*" },
];

const mockIconDetailsById: Record<string, AssetDetailsResponse> = Object.fromEntries(
  mockIconResults.map((item) => [item.id, createDetails(item, ["Outline", "Filled"])]),
);

export async function mockIconSearch(query: string): Promise<AssetListItem[]> {
  await delay(300);
  if (!query.trim()) return [];
  const normalized = query.toLowerCase();
  return mockIconResults.filter((item) => item.name.toLowerCase().includes(normalized));
}

export async function mockIconDetails(id: string): Promise<AssetDetailsResponse> {
  await delay(400);
  const details = mockIconDetailsById[id];
  if (!details) throw new Error(`Icon not found: ${id}`);
  return details;
}

export async function mockEmptySearch(): Promise<AssetListItem[]> {
  await delay(300);
  return [];
}

export async function mockFailingSearch(): Promise<AssetListItem[]> {
  await delay(300);
  throw new Error("Search service unavailable");
}

export function createTrpcAssetHandlers(
  search: (query: string) => Promise<AssetListItem[]>,
  getDetails: (id: string) => Promise<AssetDetailsResponse>,
) {
  return {
    search: {
      query: async ({ query }: { query: string }) => ({ results: await search(query) }),
    },
    getDetails: {
      query: async ({ externalId }: { externalId: string }) => getDetails(externalId),
    },
  };
}
