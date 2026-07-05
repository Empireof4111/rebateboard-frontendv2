export type ApiResponse<T> = {
  success: boolean;
  message: string;
  payload?: T;
};

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const LOCAL_API_BASE_URL = "http://localhost:8081/api/v1";
const PRODUCTION_API_BASE_URL = "https://rebateboard-backendv2.onrender.com/api/v1";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  if (configuredBaseUrl?.trim()) return normalizeBaseUrl(configuredBaseUrl);

  if (typeof window === "undefined") return LOCAL_API_BASE_URL;

  try {
    const browserOverride = window.localStorage.getItem("rb_api_base_url");
    if (browserOverride?.trim()) return normalizeBaseUrl(browserOverride);
  } catch {
    // Ignore storage failures and keep resolving from location.
  }

  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_API_BASE_URL;
  }

  if (
    hostname.endsWith(".workers.dev") ||
    hostname === "rebateboard.com" ||
    hostname === "www.rebateboard.com"
  ) {
    return PRODUCTION_API_BASE_URL;
  }

  return `${origin.replace(/\/+$/, "")}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  payload?: unknown;

  constructor(message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.payload = payload;
  }
}

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, headers, token, ...init } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(`Backend API is unavailable at ${API_BASE_URL}`, error);
  }

  let data: ApiResponse<T> | null = null;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success) {
    throw new ApiError(data?.message || "Request failed", data?.payload);
  }

  return data;
}
