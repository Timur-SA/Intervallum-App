// Empty means "same origin": the app calls /v2/... and Caddy/Vite proxies it.
const DEFAULT_URL = '';

export const CORE_URL = (import.meta.env.VITE_CORE_API_URL ?? DEFAULT_URL).replace(/\/$/, '');

/** Fetch with a hard timeout so an unreachable Core cannot stall a task. */
export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 2500,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timer);
  }
};
