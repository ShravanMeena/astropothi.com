import jwt from "jsonwebtoken";
import config from "../config.js";
import db from "../database/index.js";
import { fail } from "../utilities/http.js";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

// NOTE: the donor codebase computed `exp` as Date.now()/100 + ... which is not a
// unix timestamp. Correct here: seconds since epoch.
export const signToken = (pandit) =>
  jwt.sign({ id: String(pandit.id), iss: "pothi", kind: "pandit" }, config.jwtSecret, { expiresIn: THIRTY_DAYS });

/**
 * Consumer tokens carry kind:"user" so the two audiences can never cross.
 * Without it, a pandit's token would satisfy a buyer route and read somebody
 * else's orders — the same secret signs both.
 */
export const signUserToken = (user) =>
  jwt.sign({ id: String(user.id), iss: "pothi", kind: "user" }, config.jwtSecret, { expiresIn: THIRTY_DAYS });

export async function authenticate(req, res, next) {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) return fail(res, "Missing token", 401);
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
  // Tokens minted before `kind` existed are pandit tokens; anything explicitly
  // marked otherwise must not pass here.
  if (payload.kind && payload.kind !== "pandit") return fail(res, "Wrong account type", 403);
  const pandit = await db.Pandit.findByPk(payload.id);
  if (!pandit) return fail(res, "Account not found", 401);
  if (pandit.status !== "active") return fail(res, "Account suspended", 403);
  req.pandit = pandit;
  pandit.update({ last_seen_at: new Date() }).catch(() => {});
  next();
}

/** Buyer-side equivalent. Populates req.user. */
export async function authenticateUser(req, res, next) {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) return fail(res, "Missing token", 401);
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
  if (payload.kind !== "user") return fail(res, "Wrong account type", 403);
  const user = await db.User.findByPk(payload.id);
  if (!user) return fail(res, "Account not found", 401);
  if (user.status !== "active") return fail(res, "Account suspended", 403);
  req.user = user;
  user.update({ last_seen_at: new Date() }).catch(() => {});
  next();
}

/**
 * Staff tokens.
 *
 * A fourth `kind`, not a flag on the pandit token. That matters because the
 * pandit token is thirty days old by the time anyone looks at it: if admin
 * rights rode inside it, revoking someone would take a month to take effect.
 * Here the claim only says "this token was minted for staff use" — whether the
 * bearer is *still* staff is re-read from the row on every single request.
 *
 * The other two guards need no change to stay safe: authenticate() rejects any
 * kind that is not "pandit", authenticateUser() any kind that is not "user".
 * So an admin token opens nothing except /admin-api/v1.
 */
export const signAdminToken = (pandit) =>
  jwt.sign({ id: String(pandit.id), iss: "pothi", kind: "admin" }, config.jwtSecret, { expiresIn: THIRTY_DAYS });

export async function authenticateAdmin(req, res, next) {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) return fail(res, "Missing token", 401);
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
  // Strict equality, not `payload.kind && ...`. A legacy token with no kind is a
  // pandit token, and pandit tokens must never reach this namespace.
  if (payload.kind !== "admin") return fail(res, "Wrong account type", 403);
  const pandit = await db.Pandit.findByPk(payload.id);
  if (!pandit) return fail(res, "Account not found", 401);
  if (pandit.status !== "active") return fail(res, "Account suspended", 403);
  // Re-read on every request: clearing is_admin logs the panel out at once.
  if (!pandit.is_admin) return fail(res, "Not an administrator", 403);
  req.admin = pandit;
  pandit.update({ last_seen_at: new Date() }).catch(() => {});
  next();
}
