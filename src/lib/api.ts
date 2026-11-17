/** Thin client for alnojoom-backend. The staff session travels in an HttpOnly cookie. */

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:4000";
const ADMIN = `${BASE}/api/v1/admin`;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

/** Called when any request comes back 401, so the app can return to the login screen. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

type Body = Record<string, unknown> | unknown[] | FormData | undefined;

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${ADMIN}${path}`, {
      method,
      credentials: "include",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", 0);
  }

  let json: { success: boolean; data?: T; error?: { code: string; details?: unknown } } | null = null;
  try {
    json = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok || !json?.success) {
    const code = json?.error?.code ?? (res.status >= 500 ? "INTERNAL_ERROR" : "UNKNOWN");
    if (res.status === 401 && !path.startsWith("/auth/login")) onUnauthorized?.();
    throw new ApiError(code, res.status, json?.error?.details);
  }
  return json.data as T;
}

/** Downloads a file (e.g. a transfer receipt) with the staff cookie. */
async function blob(path: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(`${ADMIN}${path}`, { credentials: "include" });
  } catch {
    throw new ApiError("NETWORK_ERROR", 0);
  }
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    if (res.status === 401) onUnauthorized?.();
    throw new ApiError(json?.error?.code ?? "UNKNOWN", res.status);
  }
  return res.blob();
}

export const api = {
  blob,
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Body) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: Body) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: Body) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
