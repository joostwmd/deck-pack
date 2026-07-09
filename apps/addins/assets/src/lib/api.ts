class AddinApi {
  constructor(private readonly baseUrl: string) {}

  async searchLogos(query: string): Promise<any> {
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

  async searchFlags(query: string): Promise<any> {
    return this.request("/api/flags/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async getFlagDetails(flagId: string): Promise<any> {
    return this.request("/api/flags/get", {
      method: "POST",
      body: JSON.stringify({ flagId }),
    });
  }

  async searchIcons(query: string): Promise<any> {
    return this.request("/api/icons/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async getIconDetails(iconId: string): Promise<any> {
    return this.request("/api/icons/get", {
      method: "POST",
      body: JSON.stringify({ iconId }),
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
