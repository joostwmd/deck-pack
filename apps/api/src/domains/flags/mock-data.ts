export interface FlagSearchResult {
  id: string;
  name: string;
  code: string;
  previewUrl: string;
}

export interface FlagVariant {
  type: "rectangle" | "square" | "circle";
  url: string;
  width: number;
  height: number;
}

export interface FlagDetailsResponse {
  id: string;
  name: string;
  code: string;
  variants: FlagVariant[];
}

export const flagSearchResponse: FlagSearchResult[] = [
  { id: "flag_us", name: "United States", code: "US", previewUrl: "https://flagcdn.com/w320/us.png" },
  { id: "flag_gb", name: "United Kingdom", code: "GB", previewUrl: "https://flagcdn.com/w320/gb.png" },
  { id: "flag_de", name: "Germany", code: "DE", previewUrl: "https://flagcdn.com/w320/de.png" },
  { id: "flag_fr", name: "France", code: "FR", previewUrl: "https://flagcdn.com/w320/fr.png" },
  { id: "flag_jp", name: "Japan", code: "JP", previewUrl: "https://flagcdn.com/w320/jp.png" },
  { id: "flag_cn", name: "China", code: "CN", previewUrl: "https://flagcdn.com/w320/cn.png" },
  { id: "flag_br", name: "Brazil", code: "BR", previewUrl: "https://flagcdn.com/w320/br.png" },
  { id: "flag_in", name: "India", code: "IN", previewUrl: "https://flagcdn.com/w320/in.png" },
  { id: "flag_au", name: "Australia", code: "AU", previewUrl: "https://flagcdn.com/w320/au.png" },
  { id: "flag_ca", name: "Canada", code: "CA", previewUrl: "https://flagcdn.com/w320/ca.png" },
];

export function searchFlagsMock(query: string): FlagSearchResult[] {
  const normalizedQuery = query.toLowerCase();
  return flagSearchResponse.filter(
    (flag) =>
      flag.name.toLowerCase().includes(normalizedQuery) ||
      flag.code.toLowerCase().includes(normalizedQuery),
  );
}

export function getFlagByIdMock(flagId: string): FlagDetailsResponse | null {
  const flag = flagSearchResponse.find((f) => f.id === flagId);
  if (!flag) return null;

  const code = flag.code.toLowerCase();

  return {
    id: flag.id,
    name: flag.name,
    code: flag.code,
    variants: [
      {
        type: "rectangle",
        url: `https://flagcdn.com/w320/${code}.png`,
        width: 320,
        height: 213,
      },
      {
        type: "square",
        url: `https://flagcdn.com/h240/${code}.png`,
        width: 240,
        height: 240,
      },
      {
        type: "circle",
        url: `https://flagcdn.com/h240/${code}.png`,
        width: 240,
        height: 240,
      },
    ],
  };
}
