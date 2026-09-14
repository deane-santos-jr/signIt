import { cookies } from "next/headers";
import { env } from "./env";

const COOKIE = "signit_session";
const SESSION_DAYS = 30;

const encoder = new TextEncoder();

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(env.authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(payload: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    encoder.encode(payload),
  );
  return toBase64Url(signature);
}

export async function createSessionValue(email: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ email, expiresAt })).toString(
    "base64url",
  );
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionValue(
  value: string | undefined,
): Promise<string | null> {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  if ((await sign(payload)) !== signature) return null;
  const { email, expiresAt } = JSON.parse(
    Buffer.from(payload, "base64url").toString(),
  ) as { email: string; expiresAt: number };
  if (Date.now() > expiresAt) return null;
  if (email !== env.adminEmail()) return null;
  return email;
}

export async function setSessionCookie(email: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, await createSessionValue(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentAdminEmail(): Promise<string | null> {
  const jar = await cookies();
  return verifySessionValue(jar.get(COOKIE)?.value);
}

export async function requireAdmin(): Promise<string> {
  const email = await currentAdminEmail();
  if (!email) throw new Error("Unauthorized");
  return email;
}

export const sessionCookieName = COOKIE;
