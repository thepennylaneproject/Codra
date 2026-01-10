#!/usr/bin/env node
/**
 * Enrich Codra asset index using Cloudinary Admin API.
 *
 * Inputs:
 *  - assets-index-raw.json (array of records with cloudinary_public_id + url + tags + purpose + aspect_hint)
 *
 * Outputs:
 *  - assets-index-enriched.json
 *  - assets-index-enriched.csv
 *  - assets-enrichment-receipt.json
 *
 * Auth:
 *  - Either CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
 *    OR CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 *
 * Usage:
 *  node enrich-assets-index.mjs --in /path/assets-index-raw.json --outDir ./out --concurrency 5
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Load .env.local if it exists
const envLocalPath = path.join(path.dirname(new URL(import.meta.url).pathname), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function parseArgs(argv) {
  const args = { inFile: "", outDir: "", concurrency: 5, dryRun: false, limit: 0, offset: 0 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--in") args.inFile = argv[++i];
    else if (a === "--outDir") args.outDir = argv[++i];
    else if (a === "--concurrency") args.concurrency = Number(argv[++i] ?? 5);
    else if (a === "--dryRun") args.dryRun = true;
    else if (a === "--limit") args.limit = Number(argv[++i] ?? 0);
    else if (a === "--offset") args.offset = Number(argv[++i] ?? 0);
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function parseCloudinaryEnv() {
  const url = process.env.CLOUDINARY_URL;
  if (url && url.startsWith("cloudinary://")) {
    const withoutScheme = url.replace("cloudinary://", "");
    const [creds, cloudName] = withoutScheme.split("@");
    const [apiKey, apiSecret] = creds.split(":");
    if (!apiKey || !apiSecret || !cloudName) throw new Error("Invalid CLOUDINARY_URL format.");
    return { cloudName, apiKey, apiSecret };
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary credentials. Set CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
  }
  return { cloudName, apiKey, apiSecret };
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function toIsoNow() {
  return new Date().toISOString();
}

function aspectClass(w, h) {
  if (!w || !h) return "unknown";
  const r = w / h;
  if (r > 2.2) return "panorama";
  if (r > 1.15) return "landscape";
  if (r < 0.87) return "portrait";
  return "square";
}

function sizeClass(w, h, purpose) {
  const maxDim = Math.max(w ?? 0, h ?? 0);
  if (purpose === "icon") return "icon";
  if (maxDim >= 2000) return "hero";
  if (maxDim >= 900) return "card";
  if (purpose === "bg_texture") return "texture";
  if (maxDim > 0) return "small";
  return "unknown";
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeCloudinaryPublicId(input) {
  if (!input) return null;

  let s = String(input).split("?")[0]; // strip query params

  // If it's a URL, extract the upload path
  const uploadIndex = s.indexOf("/upload/");
  if (uploadIndex !== -1) {
    s = s.slice(uploadIndex + "/upload/".length);
  }

  // Remove transformation segments (everything before /v123/)
  const versionMatch = s.match(/\/v\d+\//);
  if (versionMatch) {
    s = s.slice(versionMatch.index + versionMatch[0].length);
  }

  // Remove leading version if still present
  s = s.replace(/^v\d+\//, "");

  // Remove file extension
  s = s.replace(/\.[a-z0-9]+$/i, "");

  return s || null;
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    err.status = res.status;
    err.details = data;
    err.retryAfter = res.headers.get("retry-after"); // seconds, if provided
    throw err;
  }
  return data;
}

async function getResourceMeta({ cloudName, apiKey, apiSecret }, publicId) {
  const encodedPublicId = encodeURIComponent(publicId);
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/${encodedPublicId}`;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  return fetchJson(endpoint, {
    headers: {
      Authorization: `Basic ${auth}`,
      "User-Agent": "codra-assets-enricher/1.0",
    },
  });
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  async function runner() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const my = idx++;
      if (my >= items.length) break;
      results[my] = await worker(items[my], my);
    }
  }
  const runners = [];
  for (let i = 0; i < Math.max(1, concurrency); i++) runners.push(runner());
  await Promise.all(runners);
  return results;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.inFile) {
    console.log(`Usage:
  node enrich-assets-index.mjs --in assets-index-raw.json --outDir ./out --concurrency 5 [--dryRun] [--limit N] [--offset N]

Env:
  CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  OR CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
`);
    process.exit(args.help ? 0 : 1);
  }

  const inFile = path.resolve(args.inFile);
  const outDir = path.resolve(args.outDir || path.dirname(inFile));
  const concurrency = Number.isFinite(args.concurrency) ? args.concurrency : 5;

  const creds = parseCloudinaryEnv();

  const raw = JSON.parse(fs.readFileSync(inFile, "utf8"));
  if (!Array.isArray(raw)) throw new Error("Input JSON must be an array.");

  let items = raw;
  if (args.offset && args.offset > 0) {
    items = items.slice(args.offset);
  }
  if (args.limit && args.limit > 0) {
    items = items.slice(0, args.limit);
  }

  const startedAt = Date.now();
  const enrichedAt = toIsoNow();

  const failures = [];

  if (args.dryRun) {
    console.log(`[dryRun] Would enrich ${items.length} assets from ${inFile}`);
    process.exit(0);
  }

  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Enriching ${items.length} assets (concurrency=${concurrency})...`);

  const outputs = await runPool(
    items,
    async (rec) => {
      const url = rec.url;
      const publicId = normalizeCloudinaryPublicId(
        rec.cloudinary_public_id || rec.cloudinaryPublicId || rec.url
      );
      if (!publicId) {
        failures.push({ url, reason: "missing_public_id" });
        return null;
      }

      let meta = null;
      for (let attempt = 1; attempt <= 6; attempt++) {
        try {
          meta = await getResourceMeta(creds, publicId);
          break;
        } catch (e) {
          const status = e?.status;

          // Non-retryable: 404 means deleted asset
          if (status === 404) {
            failures.push({
              url,
              publicId,
              reason: "not_found",
              status: 404,
              details: e?.details ?? null,
            });
            return null;
          }

          // Retryable errors
          const isRateLimit = status === 429;
          const isRetryable = isRateLimit || status === 408 || (status >= 500 && status <= 599);

          if (!isRetryable || attempt === 6) {
            failures.push({
              url,
              publicId,
              reason: "cloudinary_fetch_failed",
              status: status ?? null,
              details: e?.details ?? null,
            });
            return null;
          }

          // Backoff: use Retry-After if provided, else exponential + jitter
          let sleepMs;
          if (isRateLimit && e.retryAfter) {
            sleepMs = (Number(e.retryAfter) || 1) * 1000;
          } else {
            const base = 800 * Math.pow(2, attempt - 1); // 800ms, 1.6s, 3.2s, ...
            const jitter = Math.floor(Math.random() * 300);
            sleepMs = Math.min(20000, base + jitter); // cap at 20s
          }
          await new Promise((r) => setTimeout(r, sleepMs));
        }
      }

      const width = meta?.width ?? null;
      const height = meta?.height ?? null;
      const bytes = meta?.bytes ?? null;
      const format = meta?.format ?? rec.format ?? null;

      const transparent =
        typeof meta?.has_alpha === "boolean"
          ? meta.has_alpha
          : format === "png" || format === "webp"
          ? null
          : false;

      const aspectRatio = width && height ? width / height : null;

      const purpose = rec.purpose ?? "unknown";
      const aspectHint = rec.aspect_hint ?? "unknown";
      const aspect = aspectClass(width, height);
      const size = sizeClass(width, height, purpose);

      const cloudinaryPublicId = publicId;
      const assetId = sha256(cloudinaryPublicId).slice(0, 16);

      return {
        assetId,
        cloudinaryPublicId,
        cloudinaryUrl: meta?.secure_url ?? url ?? null,
        tags: Array.isArray(rec.tags)
          ? rec.tags
          : typeof rec.tags === "string"
          ? rec.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        purpose,
        aspectHint,
        aspectRatio,
        aspectClass: aspect,
        sizeClass: size,
        format,
        width,
        height,
        bytes,
        transparent,
        product: "unknown",
        variant: "unknown",
        hasGoldAccent: null,
        tileable: null,
        notes: "",
        createdAt: meta?.created_at ?? null,
        enrichedAt,
      };
    },
    concurrency
  );

  const enriched = outputs.filter(Boolean);

  const durationMs = Date.now() - startedAt;

  const outJson = path.join(outDir, "assets-index-enriched.json");
  fs.writeFileSync(outJson, JSON.stringify(enriched, null, 2), "utf8");

  const outCsv = path.join(outDir, "assets-index-enriched.csv");
  const cols = [
    "assetId",
    "cloudinaryPublicId",
    "cloudinaryUrl",
    "purpose",
    "aspectHint",
    "aspectRatio",
    "aspectClass",
    "sizeClass",
    "format",
    "width",
    "height",
    "bytes",
    "transparent",
    "product",
    "variant",
    "hasGoldAccent",
    "tileable",
    "notes",
    "createdAt",
    "enrichedAt",
    "tags",
  ];
  const lines = [];
  lines.push(cols.join(","));
  for (const r of enriched) {
    const row = cols.map((c) => {
      if (c === "tags") return csvEscape((r.tags ?? []).join("|"));
      return csvEscape(r[c]);
    });
    lines.push(row.join(","));
  }
  fs.writeFileSync(outCsv, lines.join("\n"), "utf8");

  const receipt = {
    ok: failures.length === 0,
    inputs: {
      inFile,
      countRequested: items.length,
      concurrency,
    },
    outputs: {
      outDir,
      enrichedJson: outJson,
      enrichedCsv: outCsv,
    },
    results: {
      succeeded: enriched.length,
      failed: failures.length,
    },
    failures,
    durationMs,
    enrichedAt,
  };

  const outReceipt = path.join(outDir, "assets-enrichment-receipt.json");
  fs.writeFileSync(outReceipt, JSON.stringify(receipt, null, 2), "utf8");

  console.log(`Done.
  Succeeded: ${enriched.length}
  Failed:    ${failures.length}
  Wrote:
    ${outJson}
    ${outCsv}
    ${outReceipt}`);
}

main().catch((e) => {
  console.error("Enrichment failed:", e);
  process.exit(1);
});
