import crypto from "node:crypto";

export const SESSION_COOKIE = "jb_coc_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export interface SessionPayload {
  email: string;
}

interface SessionData extends SessionPayload {
  iat: number;
  exp: number;
}

function getSecret(): string {
  return process.env.AUTH_SECRET || "jb-coc-development-secret-change-me";
}

function sign(body: string): string {
  return crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
}

export function createSessionToken(payload: SessionPayload): string {
  const now = Date.now();
  const data: SessionData = {
    email: payload.email,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SessionData>;
    if (typeof data.email !== "string") return null;
    if (typeof data.exp === "number" && data.exp < Date.now()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
