// src/lib/api.ts
// ─────────────────────────────────────────────────────────
// Single Axios instance for the entire app.
// All service files must import { api } from this module.
// ─────────────────────────────────────────────────────────
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_APP_BASE_API_URL ||
    "https://backend-api.getnobis.com/api/v2",
});

// ── Holder for the token getter (set by attachAuthInterceptor) ──
let _getToken: ((opts?: Record<string, unknown>) => Promise<string>) | null =
  null;

// ── Response interceptor (global error handling + 401 retry) ──
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If we get a 401 and haven't retried yet, try refreshing the token
    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      _getToken
    ) {
      originalRequest._retry = true;
      console.warn("[api] 401 received — attempting token refresh…");

      try {
        // Force Auth0 to fetch a fresh token (ignoring cache)
        const freshToken = await _getToken({ cacheMode: "off" });
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        console.error("[api] Token refresh failed:", refreshErr);
        // Fall through to reject
      }
    }

    if (error?.response?.status === 401) {
      console.warn("[api] Unauthorized — token may be expired");
    }

    return Promise.reject(error);
  }
);

// ── Auth interceptor ────────────────────────────────────
// Call this ONCE from <AuthAxiosBootstrap /> after Auth0 is ready.
// Returns an eject/cleanup function.
export function attachAuthInterceptor(
  getAccessTokenSilently: (opts?: Record<string, unknown>) => Promise<string>
) {
  // Store reference so the response interceptor can use it for retries
  _getToken = getAccessTokenSilently;

  const reqId = api.interceptors.request.use(async (config) => {
    // Skip if a token was already set manually
    if (config.headers?.Authorization) return config;

    try {
      const token = await getAccessTokenSilently();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      // Token fetch failed — let the request go through un-authed
      // so the 401 response handler can deal with it.
      console.warn("[api] Could not attach access token:", err);
    }

    return config;
  });

  return () => {
    api.interceptors.request.eject(reqId);
    _getToken = null;
  };
}
