#!/usr/bin/env node
/**
 * Bulk Enrich Codra asset index using Cloudinary Search API.
 *
 * This version uses the Search API to fetch ALL resources in ~3-5 paginated calls
 * instead of 1 call per asset. Much faster and avoids rate limits.
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
 *  node enrich-assets-bulk.mjs --outDir ./out [--dryRun]
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
  const args = { outDir: "", dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--outDir") args.outDir = argv[++i];
    else if (a === "--dryRun") args.dryRun = true;
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

function sizeClass(w, h, role) {
  const maxDim = Math.max(w ?? 0, h ?? 0);
  if (role === "icon") return "icon";
  if (maxDim >= 2000) return "hero";
  if (maxDim >= 900) return "card";
  if (role && (role.startsWith("background") || role.startsWith("texture"))) return "texture";
  if (maxDim > 0) return "small";
  return "unknown";
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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
    err.retryAfter = res.headers.get("retry-after");
    throw err;
  }
  return data;
}

async function searchResources({ cloudName, apiKey, apiSecret }, nextCursor = null) {
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const body = {
    expression: "resource_type:image",
    max_results: 500,
    with_field: ["tags", "context", "metadata"],
  };
  if (nextCursor) {
    body.next_cursor = nextCursor;
  }

  return fetchJson(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      "User-Agent": "codra-assets-enricher/2.0",
    },
    body: JSON.stringify(body),
  });
}

async function fetchAllResources(creds) {
  const allResources = [];
  let nextCursor = null;
  let page = 1;

  do {
    console.log(`  Fetching page ${page}...`);
    const result = await searchResources(creds, nextCursor);
    const resources = result.resources || [];
    allResources.push(...resources);
    nextCursor = result.next_cursor || null;
    console.log(`    Got ${resources.length} resources (total: ${allResources.length})`);
    page++;
  } while (nextCursor);

  return allResources;
}

function enrichResource(resource) {
  const publicId = resource.public_id;
  const width = resource.width ?? null;
  const height = resource.height ?? null;
  const bytes = resource.bytes ?? null;
  const format = resource.format ?? null;
  const transparent = typeof resource.has_alpha === "boolean" ? resource.has_alpha : null;
  const aspectRatio = width && height ? width / height : null;
  const aspect = aspectClass(width, height);
  const assetId = sha256(publicId).slice(0, 16);
  const enrichedAt = toIsoNow();
  const meta = resource.metadata || {};
  const role = meta.image_role || "other";
  const energy = meta.energy || "low";
  const lifecycleStatus = meta.lifecycle_status || "approved";
  const productFamily = meta.product_family || "relevnt_core";
  const assetClass = meta.asset_class || (format === 'svg' ? 'vector' : 'raster');
  const vectorType = meta.vector_type || "mixed";
  const isInvertible = meta.is_invertible === 'true';
  const isThemable = meta.is_themable === 'true';
  const complexity = meta.complexity || "low";
  const size = sizeClass(width, height, role);

  return {
    assetId,
    cloudinaryPublicId: publicId,
    cloudinaryUrl: resource.secure_url ?? null,
    tags: Array.isArray(resource.tags) ? resource.tags : [],
    role,
    energy,
    lifecycleStatus,
    productFamily,
    assetClass,
    vectorType,
    isInvertible,
    isThemable,
    complexity,
    aspectHint: "unknown",
    aspectRatio,
    aspectClass: aspect,
    sizeClass: size,
    format,
    width,
    height,
    bytes,
    transparent,
    variant: "unknown",
    hasGoldAccent: null,
    tileable: null,
    notes: "",
    createdAt: resource.created_at ?? null,
    enrichedAt,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node enrich-assets-bulk.mjs --outDir ./out [--dryRun]

Env:
  CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  OR CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
`);
    process.exit(0);
  }

  const outDir = path.resolve(args.outDir || ".");
  const creds = parseCloudinaryEnv();
  const startedAt = Date.now();

  console.log("Fetching all resources from Cloudinary using Search API...");

  if (args.dryRun) {
    console.log("[dryRun] Would fetch all resources from Cloudinary");
    process.exit(0);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const resources = await fetchAllResources(creds);
  console.log(`\nTotal resources fetched: ${resources.length}`);

  console.log("Enriching resources...");
  const enriched = resources.map(enrichResource);

  const durationMs = Date.now() - startedAt;

  const outJson = path.join(outDir, "assets-index-enriched.json");
  fs.writeFileSync(outJson, JSON.stringify(enriched, null, 2), "utf8");

  const outCsv = path.join(outDir, "assets-index-enriched.csv");
  const cols = [
    "assetId",
    "cloudinaryPublicId",
    "cloudinaryUrl",
    "role",
    "energy",
    "lifecycleStatus",
    "productFamily",
    "assetClass",
    "vectorType",
    "isInvertible",
    "isThemable",
    "complexity",
    "aspectHint",
    "aspectRatio",
    "aspectClass",
    "sizeClass",
    "format",
    "width",
    "height",
    "bytes",
    "transparent",
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
    ok: true,
    inputs: {
      method: "search_api",
    },
    outputs: {
      outDir,
      enrichedJson: outJson,
      enrichedCsv: outCsv,
    },
    results: {
      succeeded: enriched.length,
      failed: 0,
    },
    durationMs,
    enrichedAt: toIsoNow(),
  };

  const outReceipt = path.join(outDir, "assets-enrichment-receipt.json");
  fs.writeFileSync(outReceipt, JSON.stringify(receipt, null, 2), "utf8");

  console.log(`Done.
  Succeeded: ${enriched.length}
  Duration:  ${durationMs}ms
  Wrote:
    ${outJson}
    ${outCsv}
    ${outReceipt}`);
}

main().catch((e) => {
  console.error("Enrichment failed:", e);
  process.exit(1);
});
