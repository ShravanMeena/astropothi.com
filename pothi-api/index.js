import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import config from "./config.js";
import { noAuthRoutes, authRoutes, buyerRoutes, adminRoutes } from "./server/index.route.js";

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

// Dev only: serve locally-written report PDFs. In production these live in S3.
if (config.env !== "production") {
  app.use("/files", express.static(path.resolve(import.meta.dirname, "out")));
}

app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use((err, req, res, _next) => {
  console.error("[error]", err);
  res.status(err.code >= 400 && err.code < 600 ? err.code : 500)
     .json({ success: false, message: err.message || "Internal error" });
});

export default app;
