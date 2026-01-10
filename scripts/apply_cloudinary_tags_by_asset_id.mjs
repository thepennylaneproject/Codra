#!/usr/bin/env node

/**
 * apply_cloudinary_tags_by_asset_id.mjs
 * 
 * Bulk updates Cloudinary tags AND Structured Metadata.
 * Uses the Upload API (explicit) to bypass Admin/Search rate limits.
 * Implements a mapping layer to convert raw AI analysis into a sustainable taxonomy.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import pLimit from 'p-limit';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

// --- Configuration & Setup ---

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.join(path.dirname(__dirname), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_DIR = path.join(path.dirname(__dirname), 'reports');

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function errorLog(msg) {
  console.error(`[${new Date().toISOString()}] ERROR: ${msg}`);
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags
    .map(t => String(t).trim())
    .filter(t => t.length > 0)
  )];
}

// --- Mapping Logic ---

function mapMetadata(item) {
  const metadata = {};
  const pid = item.publicId || '';
  const tags = normalizeTags(item.tags).map(t => t.toLowerCase());
  const mood = (item.mood || '').toLowerCase();

  // 1. Product Family
  if (pid.includes('DeepWater')) metadata.product_family = 'deepwater';
  else if (pid.includes('Steel')) metadata.product_family = 'steel';
  else if (pid.includes('Diamond')) metadata.product_family = 'diamond';
  else if (pid.includes('Pro_')) metadata.product_family = 'pro';
  else if (pid.includes('Starter_')) metadata.product_family = 'starter';
  else if (pid.startsWith('Playful_')) metadata.product_family = 'other';
  else metadata.product_family = 'relevnt_core';

  // 2. Image Role
  const lcUseCase = (item.suggestedUseCase || '').toLowerCase();
  const isBgPattern = pid.toLowerCase().includes('background') || tags.includes('background') || tags.includes('bg_texture') || lcUseCase.includes('background');
  const isTexturePattern = pid.toLowerCase().includes('texture') || tags.includes('bg_texture') || lcUseCase.includes('texture');

  if (isBgPattern && !isTexturePattern) {
    if (mood.includes('dynamic') || mood.includes('bold') || tags.includes('vibrant')) metadata.image_role = 'background-dynamic';
    else if (mood.includes('structured') || mood.includes('geometric') || tags.includes('geometric')) metadata.image_role = 'background-structured';
    else metadata.image_role = 'background-soft';
  } else if (isTexturePattern) {
    if (tags.some(t => t.includes('paper')) || lcUseCase.includes('paper')) metadata.image_role = 'texture_paper';
    else if (tags.some(t => t.includes('grain')) || lcUseCase.includes('grain')) metadata.image_role = 'texture_grain';
    else if (tags.some(t => t.includes('grid')) || lcUseCase.includes('grid')) metadata.image_role = 'texture_grid';
    else if (tags.some(t => t.includes('organic') || t.includes('natural'))) metadata.image_role = 'texture_organic';
    else if (tags.some(t => t.includes('industrial') || t.includes('tech'))) metadata.image_role = 'texture_industrial';
    else metadata.image_role = 'texture_organic';
  } else if (pid.includes('SpotIllustration') || tags.includes('spot_illustration') || lcUseCase.includes('illustration')) {
    metadata.image_role = 'spot_illustration';
  } else if (pid.includes('FeatureCard') || tags.includes('feature_card') || lcUseCase.includes('card')) {
    metadata.image_role = 'feature_card';
  } else if (pid.includes('Hero') || tags.includes('hero') || lcUseCase.includes('hero')) {
    metadata.image_role = 'hero';
  } else if (pid.includes('Icon') || tags.includes('icon') || lcUseCase.includes('icon')) {
    metadata.image_role = 'icon';
  } else {
    metadata.image_role = 'other';
  }

  // 3. Energy
  const highEnergyTags = ['dynamic', 'complex', 'bold', 'vibrant', 'gradient-heavy', 'colorful'];
  const lowEnergyTags = ['calm', 'soft', 'minimal', 'subtle', 'smooth', 'clean', 'simple'];
  const energyScore = tags.filter(t => highEnergyTags.includes(t)).length - 
                      tags.filter(t => lowEnergyTags.includes(t)).length;
  
  if (energyScore > 1) metadata.energy = 'high';
  else if (energyScore < -1) metadata.energy = 'low';
  else metadata.energy = 'medium';

  // 4. Aspect Class
  if (item.aspectClass) metadata.aspect_class = item.aspectClass;

  // 5. Transparency
  metadata.is_transparent = item.transparent ? 'true' : 'false';

  // 6. Mood
  if (item.mood) metadata.mood = item.mood;

  return metadata;
}

// --- Cloudinary Setup ---

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// --- Main Script Logic ---

async function run() {
  const args = {};
  process.argv.slice(2).forEach(val => {
    if (val.startsWith('--')) {
      const parts = val.split('=');
      const key = parts[0].replace('--', '');
      args[key] = parts[1] || true;
    }
  });

  const inputFile = args.input;
  const indexFile = args.index || 'out/assets-index-enriched.json';
  const isDryRun = args['dry-run'] !== 'false';
  const concurrency = parseInt(args.concurrency || 10, 10);
  const limitCount = parseInt(args.limit || 0, 10);

  if (!inputFile) {
    errorLog('Usage: node apply_cloudinary_tags_by_asset_id.mjs --input=analysis.json [--index=index.json] [--dry-run=false]');
    process.exit(1);
  }

  // 1. Data Loading & Joining
  log(`Loading analysis results: ${inputFile}...`);
  const analysisData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  log(`Loading asset index: ${indexFile}...`);
  let indexData = [];
  if (fs.existsSync(indexFile)) {
    indexData = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  }

  const indexMap = new Map();
  indexData.forEach(item => indexMap.set(item.cloudinaryPublicId, item));

  let items = analysisData.map(d => {
    const structural = indexMap.get(d.publicId) || {};
    const tags = [
      ...(d.existingTags || []),
      ...(d.generatedTags || [])
    ];
    return {
      publicId: d.publicId,
      assetId: d.assetId,
      tags: normalizeTags(tags),
      mood: d.mood,
      primaryColor: d.primaryColor,
      suggestedUseCase: d.suggestedUseCase,
      aspectClass: structural.aspectClass,
      transparent: structural.transparent,
      sizeClass: structural.sizeClass
    };
  });

  if (limitCount > 0) items = items.slice(0, limitCount);

  log(`Preflight Summary:`);
  log(`- Total Items: ${items.length}`);
  log(`- Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  log(`- Concurrency: ${concurrency}`);

  if (isDryRun) log('--- DRY RUN: No API changes will be made ---');
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const limit = pLimit(concurrency);
  const records = [];
  const errors = [];
  let successCount = 0;
  let completed = 0;

  const tasks = items.map(item => limit(async () => {
    const record = {
      asset_id: item.assetId,
      public_id: item.publicId,
      status: 'pending',
      message: ''
    };

    try {
      if (!item.publicId) throw new Error('Missing publicId');

      const metadata = mapMetadata(item);
      const tags = normalizeTags(item.tags);
      const context = {
        mood: item.mood,
        primary_color: item.primaryColor,
        suggested_use_case: item.suggestedUseCase
      };

      if (isDryRun) {
        record.status = 'success';
        const metaStr = Object.entries(metadata).map(([k, v]) => `${k}=${v}`).join(', ');
        record.message = `[DRY RUN] Would set tags: [${tags.join(', ')}] AND metadata: {${metaStr}}`;
      } else {
        await cloudinary.uploader.explicit(item.publicId, {
          type: 'upload',
          tags,
          context,
          metadata
        });
        record.status = 'success';
        record.message = 'Tags, Context, and Structured Metadata updated successfully';
      }
      successCount++;
    } catch (err) {
      const errMsg = err?.message || (err?.error?.message) || JSON.stringify(err);
      record.status = 'failed';
      record.message = errMsg;
      errors.push({ id: item.publicId, error: errMsg });
      errorLog(`Failed processing ${item.publicId}: ${errMsg}`);
    }

    records.push(record);
    completed++;
    if (completed % 10 === 0) log(`Progress: ${completed}/${items.length}...`);
  }));

  await Promise.all(tasks);

  // Generate Reports
  const finalReport = {
    summary: {
      total: items.length,
      success: successCount,
      failed: errors.length,
      isDryRun,
      timestamp: TIMESTAMP
    },
    records
  };

  const jsonPath = path.join(REPORT_DIR, `asset_sync_${TIMESTAMP}.json`);
  const csvPath = path.join(REPORT_DIR, `asset_sync_${TIMESTAMP}.csv`);
  
  fs.writeFileSync(jsonPath, JSON.stringify(finalReport, null, 2));
  
  const csvHeaders = 'public_id,status,message\n';
  const csvRows = records.map(r => `"${r.public_id}","${r.status}","${r.message.replace(/"/g, '""')}"`).join('\n');
  fs.writeFileSync(csvPath, csvHeaders + csvRows);

  log(`Processing Complete!`);
  log(`SUCCESS: ${successCount}`);
  log(`FAILED:  ${errors.length}`);
  log(`Reports saved to: ${REPORT_DIR}`);
}

run().catch(err => {
  errorLog(`Fatal error: ${err.message}`);
  process.exit(1);
});
