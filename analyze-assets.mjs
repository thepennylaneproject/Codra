#!/usr/bin/env node
/**
 * Analyze and tag Cloudinary assets using Anthropic Claude Vision.
 *
 * Uses your existing ANTHROPIC_API_KEY to analyze images and generate tags
 * based on a comprehensive taxonomy.
 *
 * Usage:
 *  node analyze-assets.mjs --outDir ./out [--limit N] [--concurrency N] [--dryRun]
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Formats supported by Claude Vision API
const SUPPORTED_FORMATS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

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

// Comprehensive tag taxonomy
const TAG_TAXONOMY = `
## Visual Style
minimal, modern, abstract, geometric, gradient-heavy, 3d, flat, line-art, illustrated

## Color Themes  
warm-palette, cool-palette, neutral-palette, gold-accent, teal-accent, purple-accent, translucent, monochrome, vibrant, muted

## Industry/Use Case
tech, saas, corporate, startup, career, ai, professional, creative, finance, healthcare

## Mood/Emotion
professional, innovative, trustworthy, sophisticated, approachable, energetic, calm, bold

## Content/Elements
abstract-shapes, technology, network, glass-effect, glow, circles, lines, geometric-patterns, data-visualization

## Composition
spacious, layered, centered, asymmetric, flowing
`;

const ANALYSIS_PROMPT = `You are an expert visual designer analyzing design assets for a SaaS template library.

Analyze this image and return ONLY a JSON object with the following structure:
{
  "tags": ["tag1", "tag2", ...],
  "primaryColor": "hex or name",
  "mood": "one word",
  "suggestedUseCase": "brief description"
}

Select tags from this taxonomy (only use tags that clearly apply with high confidence):
${TAG_TAXONOMY}

Rules:
- Return 8-15 relevant tags
- Only include tags you're confident about
- Focus on visual characteristics, not guessing content meaning
- Return ONLY valid JSON, no markdown or explanation`;

function parseArgs(argv) {
  const args = { outDir: "", limit: 0, concurrency: 1, dryRun: false, inputFile: "" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--outDir") args.outDir = argv[++i];
    else if (a === "--limit") args.limit = Number(argv[++i] ?? 0);
    else if (a === "--concurrency") args.concurrency = Number(argv[++i] ?? 1);
    else if (a === "--dryRun") args.dryRun = true;
    else if (a === "--input") args.inputFile = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

/**
 * Detect transparency in an image using sharp.
 * Returns { hasAlpha, transparencyPercent } where:
 * - hasAlpha: true if image has alpha channel
 * - transparencyPercent: percentage of pixels with alpha < 255 (0-100)
 */
async function detectTransparency(imageBuffer) {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // If no alpha channel, not transparent
    if (!metadata.hasAlpha) {
      return { hasAlpha: false, transparencyPercent: 0, detectedTransparency: false };
    }
    
    // Extract raw pixel data with alpha channel
    const { data, info } = await image
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    
    const totalPixels = info.width * info.height;
    let transparentPixels = 0;
    
    // Count pixels where alpha < 255 (not fully opaque)
    // Data is RGBA format, so alpha is every 4th byte starting at index 3
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        transparentPixels++;
      }
    }
    
    const transparencyPercent = (transparentPixels / totalPixels) * 100;
    
    // Consider >1% transparent pixels as "transparent"
    const detectedTransparency = transparencyPercent > 1;
    
    return {
      hasAlpha: true,
      transparencyPercent: Math.round(transparencyPercent * 100) / 100,
      detectedTransparency,
    };
  } catch (e) {
    console.error(`  Warning: Could not detect transparency: ${e.message}`);
    return { hasAlpha: false, transparencyPercent: 0, detectedTransparency: false };
  }
}

async function analyzeImageWithClaude(apiKey, imageUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    // First, fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      throw new Error("No content in Claude response");
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    }
    
    return JSON.parse(jsonStr);
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") {
      throw new Error("Request timed out after 60 seconds");
    }
    throw e;
  }
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  async function runner() {
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
  if (args.help) {
    console.log(`Usage:
  node analyze-assets.mjs --outDir ./out [--input ./out/assets-index-enriched.json] [--limit N] [--concurrency N] [--dryRun]

Options:
  --input       Path to enriched assets JSON (default: ./out/assets-index-enriched.json)
  --outDir      Output directory for results
  --limit       Process only N assets (for testing)
  --concurrency Number of parallel requests (default: 1)
  --dryRun      Print what would be done without calling API

Env:
  ANTHROPIC_API_KEY - Required for image analysis
`);
    process.exit(0);
  }

  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) {
    console.error("Error: ANTHROPIC_API_KEY not found in environment");
    process.exit(1);
  }

  const outDir = path.resolve(args.outDir || "./out");
  const inputFile = args.inputFile || path.join(outDir, "assets-index-enriched.json");

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    console.error("Run enrich-assets-bulk.mjs first to generate the enriched assets index.");
    process.exit(1);
  }

  const assets = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  
  // Filter to only supported formats (skip SVG, TIFF, etc.)
  const supportedAssets = assets.filter(a => {
    const format = (a.format || "").toLowerCase();
    return SUPPORTED_FORMATS.has(format);
  });
  const skippedCount = assets.length - supportedAssets.length;
  
  let items = supportedAssets;
  if (args.limit && args.limit > 0) {
    items = items.slice(0, args.limit);
  }

  console.log(`Total assets: ${assets.length}`);
  console.log(`Skipping ${skippedCount} unsupported formats (SVG, etc.)`);
  console.log(`Analyzing ${items.length} assets with Anthropic Claude 3 Haiku...`);
  console.log(`Concurrency: ${args.concurrency}`);

  if (args.dryRun) {
    console.log("[dryRun] Would analyze the following assets:");
    items.slice(0, 5).forEach((a, i) => console.log(`  ${i + 1}. ${a.cloudinaryPublicId}`));
    if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
    process.exit(0);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const startedAt = Date.now();
  const failures = [];
  const successful = [];
  let processed = 0;

  const results = await runPool(
    items,
    async (asset) => {
      const publicId = asset.cloudinaryPublicId;
      console.log(`  Starting: ${publicId.slice(0, 50)}...`);
      try {
        // Exponential backoff for rate limits
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            // Fetch image for both Claude and transparency detection
            const imageResponse = await fetch(asset.cloudinaryUrl);
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            
            // Detect transparency (deterministic check)
            const transparency = await detectTransparency(imageBuffer);
            
            // Analyze with Claude
            const analysis = await analyzeImageWithClaude(claudeKey, asset.cloudinaryUrl);
            processed++;
            
            // Check for tag mismatch: tagged as transparent but detected as opaque
            const existingTags = asset.tags || [];
            const hasTransparentTag = existingTags.some(t => 
              t.toLowerCase().includes("transparent") || t.toLowerCase().includes("alpha")
            );
            const tagMismatch = hasTransparentTag && !transparency.detectedTransparency;
            
            console.log(`  ✓ ${processed}/${items.length}: ${publicId.slice(0, 40)} (${analysis.tags?.length || 0} tags${tagMismatch ? " ⚠️ TAG MISMATCH" : ""})`);
            
            const result = {
              publicId,
              assetId: asset.assetId,
              cloudinaryUrl: asset.cloudinaryUrl,
              format: asset.format,
              existingTags,
              generatedTags: analysis.tags || [],
              primaryColor: analysis.primaryColor,
              mood: analysis.mood,
              suggestedUseCase: analysis.suggestedUseCase,
              // Transparency detection
              hasAlpha: transparency.hasAlpha,
              transparencyPercent: transparency.transparencyPercent,
              detectedTransparency: transparency.detectedTransparency,
              // Tag mismatch (quarantine candidate)
              tagMismatch,
            };
            
            // Save incrementally every 10 items
            successful.push(result);
            if (successful.length % 10 === 0) {
              const outJson = path.join(outDir, "assets-analysis-results.json");
              fs.writeFileSync(outJson, JSON.stringify(successful, null, 2), "utf8");
              console.log(`  💾 Saved ${successful.length} results to disk`);
            }
            
            // Wait 30 seconds between requests to avoid rate limits
            if (processed < items.length) {
              console.log(`  ⏳ Waiting 30s before next request...`);
              await new Promise((r) => setTimeout(r, 30000));
            }
            
            return result;
          } catch (e) {
            if (e.message.includes("429") || e.message.includes("rate") || e.message.includes("timed out")) {
              const sleepMs = Math.min(60000, 2000 * Math.pow(2, attempt));
              console.log(`  ⏳ ${publicId.slice(0, 30)}: ${e.message.slice(0, 50)}, retry ${attempt}/5...`);
              await new Promise((r) => setTimeout(r, sleepMs));
            } else {
              throw e;
            }
          }
        }
        throw new Error("Max retries exceeded");
      } catch (e) {
        failures.push({
          publicId,
          reason: e.message,
        });
        return null;
      }
    },
    args.concurrency
  );

  // Add any remaining results from runPool (in case pool returned them)
  const finalResults = results.filter(Boolean);
  // Merge with incrementally saved results (avoid duplicates)
  const allSuccessful = successful.length > 0 ? successful : finalResults;
  const durationMs = Date.now() - startedAt;

  const outJson = path.join(outDir, "assets-analysis-results.json");
  fs.writeFileSync(outJson, JSON.stringify(allSuccessful, null, 2), "utf8");

  const receipt = {
    ok: failures.length === 0,
    inputs: {
      inputFile,
      totalAssets: items.length,
      model: "claude-3-haiku",
      concurrency: args.concurrency,
    },
    outputs: {
      outDir,
      resultsJson: outJson,
    },
    results: {
      succeeded: allSuccessful.length,
      failed: failures.length,
    },
    failures: failures.slice(0, 20),
    durationMs,
    analyzedAt: new Date().toISOString(),
  };

  const outReceipt = path.join(outDir, "assets-analysis-receipt.json");
  fs.writeFileSync(outReceipt, JSON.stringify(receipt, null, 2), "utf8");

  console.log(`\nDone.
  Succeeded: ${allSuccessful.length}
  Failed:    ${failures.length}
  Duration:  ${durationMs}ms
  Wrote:
    ${outJson}
    ${outReceipt}`);
}

main().catch((e) => {
  console.error("Analysis failed:", e);
  process.exit(1);
});
