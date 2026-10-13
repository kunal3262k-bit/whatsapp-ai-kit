export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signSession(exp: number, secret: string): Promise<string> {
  return `${exp}.${await hmacHex(secret, String(exp))}`;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySession(
  value: string | undefined,
  secret: string,
  nowMs = Date.now()
): Promise<boolean> {
  if (!value || !secret) return false;
  const dot = value.indexOf('.');
  if (dot <= 0) return false;
  const exp = Number(value.slice(0, dot));
  if (!Number.isFinite(exp) || exp < nowMs) return false;
  return timingSafeEqualStr(await signSession(exp, secret), value);
}

export async function isAuthorized(
  cookieValue: string | undefined,
  secret: string | undefined,
  nowMs = Date.now()
): Promise<boolean> {
  if (!secret) return false;
  return verifySession(cookieValue, secret, nowMs);
}
