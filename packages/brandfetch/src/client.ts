import type {
  BrandfetchDetailsResponse,
  BrandfetchSearchResponse,
  GetBrandDetailsInput,
  SearchBrandsInput,
} from "./types";

export class BrandfetchClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.brandfetch.io/v2"
  ) {}

  async searchBrands(input: SearchBrandsInput): Promise<BrandfetchSearchResponse> {
    // TODO: Implement actual Brandfetch API call
    // For now, return mock data to get the basic functionality working
    const mockResponse: BrandfetchSearchResponse = {
      results: [
        {
          id: "mock-1",
          name: `${input.query} Corp`,
          domain: `${input.query.toLowerCase()}.com`,
          logo: `https://via.placeholder.com/200x200/007acc/ffffff?text=${input.query}`,
          brandId: "mock-1",
        },
        {
          id: "mock-2",
          name: `${input.query} Inc`,
          domain: `${input.query.toLowerCase()}.inc.com`,
          logo: `https://via.placeholder.com/200x200/28a745/ffffff?text=${input.query}`,
          brandId: "mock-2",
        }
      ]
    };

    return mockResponse;
  }

  async getBrandDetails(input: GetBrandDetailsInput): Promise<BrandfetchDetailsResponse> {
    // TODO: Implement actual Brandfetch API call
    // For now, return mock data
    const mockResponse: BrandfetchDetailsResponse = {
      brandId: input.brandId,
      name: "Sample Brand",
      domain: "sample.com",
      logos: [
        {
          type: "icon",
          theme: "light",
          formats: [
            {
              format: "png",
              size: 200,
              src: "https://via.placeholder.com/200x200/007acc/ffffff?text=Logo",
            },
            {
              format: "png",
              size: 400,
              src: "https://via.placeholder.com/400x400/007acc/ffffff?text=Logo",
            }
          ]
        },
        {
          type: "logo", 
          theme: "dark",
          formats: [
            {
              format: "png",
              size: 200,
              src: "https://via.placeholder.com/200x200/ffffff/000000?text=Logo",
            }
          ]
        }
      ]
    };

    return mockResponse;
  }

  private async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...init,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`Brandfetch API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }
}