import express, { Router } from "express";
import * as E from "./events.service.js";
import { ok, h } from "../../utilities/http.js";
import { whoeverThisIs, authenticateUser } from "../../platform/auth.js";

/** Public: the browser posts here, signed in or not. */
export function noAuth() {
  const r = Router();

  // sendBeacon cannot set a Content-Type header, so the unload flush arrives as
  // text/plain and express.json() leaves req.body empty. Without this parser
  // every session silently loses its last batch — which is exactly the batch
  // that says where someone gave up. body-parser marks req._body once one
  // parser has run, so this never double-parses a real JSON post.
  r.post("/", express.text({ type: "*/*", limit: "128kb" }), whoeverThisIs, h(async (req, res) => {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const out = await E.ingest(body?.events, {
      ua: req.headers["user-agent"],
      // Behind a proxy the socket address is the proxy; trust the forwarded
      // header's first hop.
      ip: String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim(),
      anonymous_id: body?.anonymous_id,
      // Stamped from the token, never from the body — otherwise anyone could
      // write events into someone else's history.
      userId: req.userId ?? null
    });
    return ok(res, out);
  }));

  // Called once, right after sign-in: everything this device did before anyone
  // knew who they were now belongs to them.
  r.post("/identify", authenticateUser, h(async (req, res) =>
    ok(res, await E.identify(String(req.body?.anonymous_id || ""), req.user.id))));

  return r;
}
