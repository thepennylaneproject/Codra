#!/usr/bin/env node

/**
 * scripts/configure-governance.mjs
 * 
 * Sets up the "lock-at-the-door" ingestion pipeline in Cloudinary:
 * 1. Named Transformations (Canonical delivery rules)
 * 2. Upload Presets (Role-aware entry points)
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.join(path.dirname(__dirname), '.env.local');
dotenv.config({ path: envLocalPath });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const TRANSFORMATIONS = [
  { name: 't_background', transformation: 'f_auto,q_auto,c_fill,g_auto' },
  { name: 't_hero', transformation: 'f_auto,q_auto,c_fill,g_auto,w_2000' },
  { name: 't_texture', transformation: 'f_auto,q_auto,c_limit,w_1600' }
];

const PRESETS = [
  {
    name: 'preset_background',
    options: {
      unsigned: false,
      tags: ['automated', 'background'],
      metadata: { 
        image_role: 'background-soft', 
        lifecycle_status: 'approved',
        asset_class: 'raster'
      },
      context: { source: 'automated_pipeline', intake_type: 'background' }
    }
  },
  {
    name: 'preset_hero',
    options: {
      unsigned: false,
      tags: ['automated', 'hero'],
      metadata: { 
        image_role: 'hero', 
        lifecycle_status: 'approved',
        asset_class: 'raster'
      },
      context: { source: 'automated_pipeline', intake_type: 'hero' }
    }
  },
  {
    name: 'preset_texture',
    options: {
      unsigned: false,
      tags: ['automated', 'texture'],
      metadata: { 
        image_role: 'texture_organic', 
        lifecycle_status: 'approved',
        asset_class: 'raster'
      },
      context: { source: 'automated_pipeline', intake_type: 'texture' }
    }
  },
  {
    name: 'preset_vector_icon',
    options: {
      unsigned: false,
      tags: ['automated', 'vector', 'icon'],
      metadata: { 
        image_role: 'icon', 
        lifecycle_status: 'approved',
        asset_class: 'vector',
        is_invertible: 'true',
        complexity: 'low'
      },
      context: { source: 'automated_pipeline', intake_type: 'vector' }
    }
  },
  {
    name: 'preset_vector_illustration',
    options: {
      unsigned: false,
      tags: ['automated', 'vector', 'illustration'],
      metadata: { 
        image_role: 'spot_illustration', 
        lifecycle_status: 'approved',
        asset_class: 'vector',
        is_invertible: 'true',
        complexity: 'medium'
      },
      context: { source: 'automated_pipeline', intake_type: 'vector' }
    }
  }
];

async function configure() {
  console.log('--- Configuring Cloudinary Governance ---');

  // 1. Create Named Transformations
  for (const t of TRANSFORMATIONS) {
    console.log(`Creating transformation: ${t.name}...`);
    try {
      await cloudinary.api.create_transformation(t.name, t.transformation);
      console.log(`  [SUCCESS]`);
    } catch (err) {
      if (err.http_code === 409) {
        console.log(`  [OK] Already exists.`);
      } else {
        console.error(`  [ERROR] ${err.message}`);
      }
    }
  }

  // 2. Create Upload Presets
  for (const p of PRESETS) {
    console.log(`Creating upload preset: ${p.name}...`);
    try {
      // Check if exists first
      try {
        await cloudinary.api.upload_preset(p.name);
        console.log(`  [OK] Already exists. Updating...`);
        await cloudinary.api.update_upload_preset(p.name, p.options);
      } catch (err) {
        const httpCode = err.http_code || (err.error && err.error.http_code);
        if (httpCode === 404) {
          console.log(`  [NEW] Creating...`);
          await cloudinary.api.create_upload_preset({ ...p.options, name: p.name });
        } else {
          console.error(`  [ERROR_INNER] http_code: ${httpCode}, message: ${err.message || (err.error && err.error.message)}`);
          throw err;
        }
      }
      console.log(`  [SUCCESS]`);
    } catch (err) {
      console.error(`  [ERROR_OUTER]`, err.message || JSON.stringify(err, null, 2));
    }
  }

  console.log('\n--- Governance Configuration Complete ---');
}

configure();
