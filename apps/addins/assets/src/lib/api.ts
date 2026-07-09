class AddinApi {
  constructor(private readonly baseUrl: string) { }

  async searchLogos(query: string): Promise<any> {
    console.log("About to call API with query:", query);
    console.log("Base URL:", this.baseUrl);
    return this.request("/api/logos/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async getLogoDetails(brandId: string): Promise<any> {
    return this.request("/api/logos/get", {
      method: "POST",
      body: JSON.stringify({ brandId }),
    });
  }

  private async request(path: string, init?: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(
        error.error || error.message || `API request failed: ${response.statusText}`,
      );
    }

    return response.json();
  }
}

const baseUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";

export const addinApi = new AddinApi(baseUrl);
