export type ApiResponse<T> = {
  success: boolean;
  message: string;
  payload?: T;
};

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (configuredBaseUrl?.trim() || "http://localhost:8081/api/v1").replace(
  /\/+$/,
  "",
);

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
