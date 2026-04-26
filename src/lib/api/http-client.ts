/**
 * APT Fitness Coach — HTTP Client
 * Abstraction layer for API calls. Currently wraps mock APIs.
 * When migrating to Cloudflare Workers + Hono, replace apiFetch internals
 * and set USE_MOCK_API = false.
 *
 * Future Hono base URL: /api (same-origin) or env-configured remote
 */

const USE_MOCK_API = true;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Core fetch wrapper. When USE_MOCK_API is false, this will make real HTTP requests.
 * Auth token injection happens here when real auth is implemented.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  if (USE_MOCK_API) {
    // In mock mode, this function is not called directly.
    // All API calls go through the mock client (client.ts).
    // This function exists as the future integration point.
    throw new Error(
      `apiFetch called in mock mode for ${path}. Use the mock API client instead.`
    );
  }

  const { method = 'GET', body, headers = {} } = options;

  const authToken = localStorage.getItem('apt_coach_token');
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    return {
      success: false,
      data: null,
      error: errorBody.error?.message || errorBody.error || `HTTP ${response.status}`,
    };
  }

  const data = await response.json();
  return { success: true, data: data.data ?? data, error: null };
}

/**
 * Check whether the app is running in mock mode.
 * Pages and hooks can use this to conditionally import mock vs real clients.
 */
export function isMockMode(): boolean {
  return USE_MOCK_API;
}
