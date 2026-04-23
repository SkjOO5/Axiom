const rawBase = import.meta.env.VITE_API_BASE_URL ?? '';

export const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
