import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "./portal";

const COOKIE_NAME = "educn_session";
const SECRET = process.env.AUTH_SECRET?.trim() || "educn-development-secret-change-in-production";

type Session = { userId: string; email: string; role: Role; nama: string; exp: number };

function signature(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(session: Omit<Session, "exp"> & { exp?: number }) {
  const payload: Session = { ...session, exp: session.exp ?? Date.now() + 1000 * 60 * 60 * 12 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifySessionToken(token?: string): Session | null {
  if (!token) return null;
  const [encoded, provided] = token.split(".");
  if (!encoded || !provided) return null;
  const expected = signature(encoded);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Session;
    if (!session.userId || !session.email || !session.role || Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export const sessionCookieName = COOKIE_NAME;
