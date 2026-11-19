import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@/lib/db";

export const SESSION_COOKIE_NAME = "bidean_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: "admin" | "eragilea";
  eragile_id?: string;
  exp: number;
}

function getSigningKey(): Buffer {
  const raw =
    process.env.SESSION_SECRET ||
    process.env.LATXA_API_KEY ||
    "bidean-eragin-bagera-session-key-2026";
  return crypto.createHash("sha256").update(raw).digest();
}

export function isHashedPassword(stored?: string | null): boolean {
  return Boolean(stored && stored.startsWith("scrypt$"));
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(plain: string, stored?: string | null): boolean {
  if (!stored) return false;
  if (isHashedPassword(stored)) {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    const [, salt, storedHex] = parts;
    try {
      const derived = crypto.scryptSync(plain, salt, 64);
      const storedBuf = Buffer.from(storedHex, "hex");
      if (derived.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(derived, storedBuf);
    } catch {
      return false;
    }
  }

  // Legacy plaintext compatibility (upgraded transparently on login)
  const a = Buffer.from(plain, "utf-8");
  const b = Buffer.from(stored, "utf-8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken(user: Pick<User, "id" | "email" | "name" | "role" | "eragile_id">): string {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    eragile_id: user.eragile_id || undefined,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningKey())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSigningKey())
      .update(encoded)
      .digest("base64url");
    const a = Buffer.from(sig, "utf-8");
    const b = Buffer.from(expectedSig, "utf-8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as SessionPayload;
    if (!decoded || !decoded.id || !decoded.role) return null;
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function setSessionCookie(
  response: NextResponse,
  user: Pick<User, "id" | "email" | "name" | "role" | "eragile_id">
): NextResponse {
  const token = createSessionToken(user);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return verifySessionToken(raw);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<
  | { session: SessionPayload; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  const session = await getSessionFromCookies();
  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: "Saioa hasi behar duzu ekintza hau egiteko." },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export async function requireAdmin(): Promise<
  | { session: SessionPayload; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (auth.session.role !== "admin") {
    return {
      error: NextResponse.json(
        { success: false, error: "Administratzaile baimena beharrezkoa da." },
        { status: 403 }
      ),
    };
  }
  return auth;
}
