/**
 * API client for the admin panel.
 * Always sends credentials so the httpOnly admin_token cookie is included.
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api/v1";

export interface ApiError {
  status: number;
  message: string;
}

export interface Paginated<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface Single<T> {
  success: boolean;
  message: string;
  data: T;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw {
      status: res.status,
      message: json?.message ?? res.statusText ?? "Request failed",
    } satisfies ApiError;
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export { buildQuery };
