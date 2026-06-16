import { SignJWT, jwtVerify } from 'jose';
import type { VercelRequest } from '@vercel/node';

const COOKIE_NAME = 'pxn_admin';
const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_JWT_SECRET missing or too short (need >= 32 chars)');
  }
  return new TextEncoder().encode(secret);
}

/** Issue a signed session token for the admin. */
export async function createSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

/** Build the Set-Cookie header value for the session (HTTP-only, Secure, SameSite). */
export function sessionCookie(token: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

/** Build a Set-Cookie header that clears the session (logout). */
export function clearCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function readCookie(req: VercelRequest, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

/**
 * Verify the admin session on an incoming request.
 * Returns true only if a valid, unexpired, correctly-signed cookie is present.
 */
export async function isAuthenticated(req: VercelRequest): Promise<boolean> {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Constant-time-ish password comparison. Not perfectly constant-time in JS,
 * but avoids the trivial early-exit of === on length mismatch for short admin
 * passwords. The login route is also rate-limited.
 */
export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (expected.length === 0) return false;
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
