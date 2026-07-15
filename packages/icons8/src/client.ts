import type {
  GetIconByIdInput,
  IconDetailsResponse,
  IconSearchResponse,
  SearchIconsInput,
} from "./types";

const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <circle cx="128" cy="128" r="80" fill="#333"/>
</svg>`;

const PLATFORMS = ["ios7", "fluent", "color"] as const;

export class Icons8Client {
  constructor(_apiKey: string, _baseUrl = "https://api-icons.icons8.com/publicApi/icons") {
    // Reserved for live Icons8 API integration
  }

  async searchIcons(input: SearchIconsInput): Promise<IconSearchResponse> {
    const term = input.term.toLowerCase();

    return {
      success: true,
      icons: [
        {
          id: "mock-icon-1",
          name: `${input.term} Icon`,
          commonName: term,
          category: "General",
          platform: "ios7",
          isFree: true,
          previewUrl: `https://img.icons8.com/ios7/1200/${term || "star"}.jpg`,
        },
        {
          id: "mock-icon-2",
          name: `${input.term} Outline`,
          commonName: term,
          category: "General",
          platform: "fluent",
          isFree: true,
          previewUrl: `https://img.icons8.com/fluency/1200/${term || "star"}.png`,
        },
        {
          id: "mock-icon-3",
          name: `${input.term} Color`,
          commonName: term,
          category: "General",
          platform: "color",
          isFree: false,
          previewUrl: `https://img.icons8.com/color/1200/${term || "star"}.png`,
        },
      ],
    };
  }

  async getIconById(input: GetIconByIdInput): Promise<IconDetailsResponse> {
    const icon = (await this.searchIcons({ term: "icon" })).icons.find((i) => i.id === input.id);

    return {
      success: true,
      id: input.id,
      name: icon?.name ?? "Mock Icon",
      category: icon?.category ?? "general",
      variants: PLATFORMS.map((platform) => ({
        platform,
        previewUrl: `https://img.icons8.com/${platform}/1200/star.png`,
        svg: MOCK_SVG,
        isFree: platform !== "color",
      })),
    };
  }
}
