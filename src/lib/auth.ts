// src/lib/auth.ts
// This file is server-only (uses Node libs).
import 'server-only';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';

// Read and cache the JWT secret with a clear error if missing
let cachedSecret: jwt.Secret | null = null;
function getJwtSecret(): jwt.Secret {
  if (cachedSecret) return cachedSecret;
  const s = process.env.JWT_SECRET;
  if (!s || !s.trim()) {
    throw new Error('JWT_SECRET is not set in .env');
  }
  cachedSecret = s;
  return cachedSecret;
}

/** One-way hash for storing passwords (bcryptjs is synchronous) */
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

/** Compare a plain password to a stored hash */
export function verifyPassword(password: string, hashed: string): boolean {
  return bcrypt.compareSync(password, hashed);
}

/** Issue a signed JWT (default 7 days). Works with TS regardless of esModuleInterop. */
export function signToken(
  payload: Record<string, unknown>,
  options: SignOptions = { expiresIn: '7d' }
): string {
  return jwt.sign(payload, getJwtSecret(), options);
}

/** Verify & decode a JWT. Throws on invalid/expired token. */
export function verifyToken<T extends object = JwtPayload>(token: string): T {
  return jwt.verify(token, getJwtSecret()) as T;
}

/** Decode without verifying (useful for debugging; do not trust output). */
export function decodeToken<T = JwtPayload>(token: string): T | null {
  return jwt.decode(token) as T | null;
}
