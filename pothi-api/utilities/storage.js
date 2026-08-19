// Where a generated PDF goes, and how it comes back.
//
// Two backends, one call site each way: Cloud Storage when a bucket is
// configured, the local `out/` directory otherwise. What NEITHER of them changes
// is the value handed back — always `/files/reports/...`, an application path.
//
// That matters more than it looks. `reports.pdf_url` is written once and then
// read by the order page, the profile, the admin panel, the WhatsApp message and
// the in-browser reader. Storing a bucket URL would mean either a public bucket
// (see below) or a signed link rotting in the database the moment it expires.
// Storing a path keeps every one of those readers ignorant of where bytes live,
// and lets `/files` mint a fresh signed URL per request.
//
// The bucket is private, and must stay private: `reports.id` is an
// autoincrementing BIGINT, so `reports/1/1.pdf` is guessable. A public bucket
// hands every customer's chart to anyone willing to count.
//
// There is no key file anywhere. On GCP the client picks up the VM's attached
// service account, and signing uses the IAM API rather than a private key — the
// org forbids service-account keys, and this is the better answer regardless:
// nothing to leak, nothing to rotate. Locally that means no bucket and no
// credentials, so the disk branch runs, which is what development wants anyway.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import config from "../config.js";

const OUT = path.resolve(import.meta.dirname, "..", "out");

let bucket = null;
async function gcs() {
  if (bucket) return bucket;
  const { Storage } = await import("@google-cloud/storage");
  bucket = new Storage().bucket(config.storage.bucket);
  return bucket;
}

/**
 * Store a finished report. Returns the path that goes in `reports.pdf_url`.
 *
 * `ownerKey` MUST be unguessable. The returned path is handed to buyers and
 * WhatsApped by pandits to their clients, so it is a capability: whoever holds
 * the URL may read the report, by design, with no account. That is only safe
 * while the URL cannot be enumerated — a sequential owner id turns the whole
 * customer base into a countable list.
 */
export async function putReportPdf(buffer, ownerKey, reportId) {
  if (!/^(consumer\/[A-Za-z0-9_-]{6,}|p\/[A-Za-z0-9_-]{6,})$/.test(String(ownerKey))) {
    throw new Error(`putReportPdf: refusing a guessable owner key "${ownerKey}"`);
  }
  const key = `reports/${ownerKey}/${reportId}.pdf`;

  if (config.storage.enabled) {
    await (await gcs()).file(key).save(buffer, {
      contentType: "application/pdf",
      metadata: { cacheControl: "private, max-age=0" }
    });
  } else {
    const dest = path.join(OUT, key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buffer);
  }

  return `/files/${key}`;
}

/** A short-lived link a browser can follow. Null when there is no bucket. */
export async function signedUrl(key) {
  if (!config.storage.enabled) return null;
  const [url] = await (await gcs()).file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + config.storage.signedUrlTtlSec * 1000
  });
  return url;
}

/**
 * Pull an object back onto this disk. The reader has to run `pdftoppm` over a
 * real file, and on a fresh container the PDF it needs is only in the bucket.
 * Returns false when there is no bucket, or the object is not in it.
 */
export async function fetchToFile(key, dest) {
  if (!config.storage.enabled) return false;
  try {
    await mkdir(path.dirname(dest), { recursive: true });
    await (await gcs()).file(key).download({ destination: dest });
    return true;
  } catch (e) {
    if (e?.code === 404) return false;
    throw e;
  }
}
