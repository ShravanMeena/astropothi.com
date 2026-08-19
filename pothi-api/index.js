import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import config from "./config.js";
import { noAuthRoutes, authRoutes, buyerRoutes, adminRoutes } from "./server/index.route.js";
import { signedUrl } from "./utilities/storage.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
// Raw body is needed for Razorpay webhook HMAC verification.
app.use(express.json({ limit: "2mb", verify: (req, _res, buf) => { req.rawBody = buf.toString(); } }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  if (req.method !== "GET") console.log(`[req] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => res.json({ ok: true, env: config.env, ts: Date.now() }));

app.use("/noauth-api/v1", noAuthRoutes());
app.use("/api/v1", authRoutes());
app.use("/user-api/v1", buyerRoutes());
app.use("/admin-api/v1", adminRoutes());

// Everything the engine rasterises or renders is addressed under /files, in every
// environment. Two different kinds of thing live there:
//
//   previews/, readers/  — caches. Regenerated on demand, so local disk is the
//                          whole story and a cold container just rebuilds them.
//   reports/             — the delivered book. In production the bytes are in a
//                          private bucket, and this redirects to a signed URL
//                          rather than proxying megabytes through Node.
//
// Serving this only in development was why previews and the reader 404'd in
// production: the PDFs had moved, but so had every image beside them.
const FILES = path.resolve(import.meta.dirname, "out");

// previews/ and readers/ are caches — sample pages of the catalogue, and page
// images of an order keyed by its unguessable public id. Cheap to regenerate,
// nothing private in a guessable place, so plain static is right for both.
app.use("/files/previews", express.static(path.join(FILES, "previews")));
app.use("/files/readers", express.static(path.join(FILES, "readers")));

/**
 * Report PDFs are NOT statically served, in any environment.
 *
 * The link is deliberately a capability — a pandit WhatsApps it to a client who
 * has no account — so it cannot require a token. That makes the URL the only
 * thing standing between a stranger and somebody's birth chart, and it has to
 * be earned twice over: the key must be unguessable (enforced in
 * utilities/storage.js) AND it must correspond to a report we still hold.
 *
 * The second check is what this handler adds. Serving `out/` statically also
 * served every orphan left behind by a deleted report — 243 of them on one
 * development machine — because a file on disk needed no row to be readable.
 * Now an object nothing points at is simply not there.
 */
app.get("/files/reports/*", async (req, res, next) => {
  const key = `reports/${req.params[0]}`;
  try {
    const { default: db } = await import("./database/index.js");
    const row = await db.Report.findOne({
      where: { pdf_url: `/files/${key}` }, attributes: ["id"]
    });
    if (!row) return next();

    if (config.storage.enabled) {
      const url = await signedUrl(key);
      if (!url) return next();
      // 302, not 301: the URL expires, and a cached permanent redirect would
      // hand a buyer a dead link tomorrow.
      return res.redirect(302, url);
    }
    return res.sendFile(path.join(FILES, key), (err) => { if (err) next(); });
  } catch (e) { next(e); }
});

app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use((err, req, res, _next) => {
  console.error("[error]", err);
  res.status(err.code >= 400 && err.code < 600 ? err.code : 500)
     .json({ success: false, message: err.message || "Internal error" });
});

export default app;
