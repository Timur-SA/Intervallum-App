export type CoreConnectionState = 'unknown' | 'online' | 'offline';

export interface CoreStatus {
  state: CoreConnectionState;
  detail: string;
  url: string;
  checkedAt: number | null;
}

const DEFAULT_URL = 'http://127.0.0.1:8000';

export const CORE_URL = (import.meta.env.VITE_CORE_API_URL ?? DEFAULT_URL).replace(/\/$/, '');

let current: CoreStatus = {
  state: 'unknown',
  detail: 'Проверяем соединение…',
  url: CORE_URL,
  checkedAt: null,
};

const listeners = new Set<(status: CoreStatus) => void>();

export const getCoreStatus = (): CoreStatus => current;

export const subscribeCoreStatus = (listener: (status: CoreStatus) => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setCoreStatus = (
  state: CoreConnectionState,
  detail: string,
): CoreStatus => {
  current = { state, detail, url: CORE_URL, checkedAt: Date.now() };
  listeners.forEach(listener => listener(current));
  return current;
};

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

export const probeCore = async (): Promise<CoreStatus> => {
  setCoreStatus('unknown', 'Проверяем соединение…');
  try {
    const response = await fetchWithTimeout(`${CORE_URL}/v2/health`, { method: 'GET' }, 1500);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { tasks?: number; status?: string };
    return setCoreStatus(
      'online',
      data.tasks ? `подключён · ${data.tasks} заданий` : 'подключён',
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'нет ответа';
    return setCoreStatus('offline', `локальный режим · ${reason}`);
  }
};
