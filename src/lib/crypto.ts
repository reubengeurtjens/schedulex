import bcrypt from "bcryptjs";

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
export function cleanEmail(e: string) {
  return e.trim().toLowerCase();
}
export function cleanName(n?: string | null) {
  return (n ?? "").trim() || null;
}
