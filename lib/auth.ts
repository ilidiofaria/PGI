import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "pgi_optima_demo";
const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  return process.env.DEMO_AUTH_SECRET || "pgi-optima-prototype-local-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(username: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(`${username}:${expiresAt}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const separator = decoded.lastIndexOf(":");
  const expiresAt = Number(decoded.slice(separator + 1));
  return Number.isFinite(expiresAt) && expiresAt > Math.floor(Date.now() / 1000);
}

export function requestIsAuthenticated(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return verifySessionToken(token);
}

export function credentialsAreValid(username: string, password: string) {
  const expectedUser = process.env.DEMO_USERNAME || "demo";
  const expectedPassword = process.env.DEMO_PASSWORD;
  if (!expectedPassword) return false;
  const userMatches = safeEqual(username, expectedUser);
  const passwordMatches = safeEqual(password, expectedPassword);
  return userMatches && passwordMatches;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
