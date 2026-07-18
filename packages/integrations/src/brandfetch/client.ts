import type {
  BrandfetchDetailsResponse,
  BrandfetchSearchResponse,
  GetBrandDetailsInput,
  SearchBrandsInput,
} from "./types";

export class BrandfetchClient {
  constructor(_apiKey: string, _baseUrl = "https://api.brandfetch.io/v2") {
    // Reserved for live Brandfetch API integration
  }

  async searchBrands(input: SearchBrandsInput): Promise<BrandfetchSearchResponse> {
    // TODO: Implement actual Brandfetch API call
    // For now, return mock data to get the basic functionality working
    const mockResponse: BrandfetchSearchResponse = {
      results: [
        {
          id: "mock-1",
          name: `${input.query} Corp`,
          domain: `${input.query.toLowerCase()}.com`,
          logo: `https://picsum.photos/200/300 `,
          brandId: "mock-1",
        },
        {
          id: "mock-2",
          name: `${input.query} Inc`,
          domain: `${input.query.toLowerCase()}.inc.com`,
          logo: `https://picsum.photos/200/300 `,
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
              src: "https://picsum.photos/200/300 ",
            },
            {
              format: "png",
              size: 400,
              src: "https://picsum.photos/400/600 ",
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
              src: "https://picsum.photos/200/300 ",
            }
          ]
        }
      ]
    };

    return mockResponse;
  }
}