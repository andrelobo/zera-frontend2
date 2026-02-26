type JwtPayload = {
  exp?: number;
  iat?: number;
};

function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function getMaxSessionAgeSeconds(): number {
  const raw = import.meta.env.VITE_SESSION_MAX_AGE_HOURS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 24 * 60 * 60;
  }
  return Math.floor(parsed * 60 * 60);
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSeconds + skewSeconds) {
    return true;
  }

  if (payload.iat) {
    const maxSessionAgeSeconds = getMaxSessionAgeSeconds();
    if (nowSeconds - payload.iat >= maxSessionAgeSeconds) {
      return true;
    }
  }

  return false;
}
