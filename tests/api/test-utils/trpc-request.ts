import superjson from "superjson";

export type TrpcResponseBody<T> = {
  result?: {
    data?: {
      json?: T;
    };
  };
  error?: {
    json?: {
      message?: string;
      code?: number;
      data?: {
        code?: string;
        zodError?: unknown;
      };
    };
  };
};

type RequestableApp = {
  request: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

function parseTrpcBody<T>(text: string): TrpcResponseBody<T> {
  if (!text) {
    return {};
  }

  return JSON.parse(text) as TrpcResponseBody<T>;
}

export async function trpcQuery<T>(
  app: RequestableApp,
  procedure: string,
  input: unknown,
  bearerToken?: string,
) {
  const serialized = superjson.serialize(input);
  const url = `/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify(serialized))}`;
  const response = await app.request(url, {
    headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {},
  });
  const text = await response.text();

  return {
    status: response.status,
    body: parseTrpcBody<T>(text),
    text,
  };
}

export async function trpcMutation<T>(
  app: RequestableApp,
  procedure: string,
  input: unknown,
  bearerToken?: string,
) {
  const response = await app.request(`/trpc/${procedure}`, {
    method: "POST",
    headers: {
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(superjson.serialize(input)),
  });
  const text = await response.text();

  return {
    status: response.status,
    body: parseTrpcBody<T>(text),
    text,
  };
}
