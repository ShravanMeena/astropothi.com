import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import config from "../config.js";

// Local disk in dev; S3 in production. Same call site either way.
// Get the S3 prefix right at bucket creation — the donor codebase is still
// stuck writing every report type under `dosh-reports/` because IAM only ever
// granted PutObject on that one prefix.
export async function putReportPdf(buffer, panditId, reportId) {
  const key = `reports/${panditId}/${reportId}.pdf`;

  if (config.env === "production" && config.s3.publicBase) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({ region: config.s3.region });
    await s3.send(new PutObjectCommand({
      Bucket: config.s3.bucket, Key: key, Body: buffer,
      ContentType: "application/pdf", CacheControl: "private, max-age=0"
    }));
    return `${config.s3.publicBase}/${key}`;
  }

  const dest = path.resolve(import.meta.dirname, "..", "out", key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  return `/files/${key}`;
}
