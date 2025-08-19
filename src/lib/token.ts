// src/lib/token.ts
export const tokenKey = 'sx_token';

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(tokenKey, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(tokenKey);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(tokenKey);
}
