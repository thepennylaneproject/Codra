#!/usr/bin/env node

/**
 * configure-cloudinary-schema.mjs
 * 
 * Formalizes the asset taxonomy by creating Structured Metadata fields in Cloudinary.
 * These fields enable deterministic asset selection for the template builder.
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.join(path.dirname(__dirname), '.env.local');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const FIELDS = [
  {
    external_id: 'product_family',
    label: 'Product Family',
    type: 'enum',
    datasource: {
      values: [
        { value: 'Relevnt Core', external_id: 'relevnt_core' },
        { value: 'DeepWater', external_id: 'deepwater' },
        { value: 'Steel', external_id: 'steel' },
        { value: 'Diamond', external_id: 'diamond' },
        { value: 'Pro', external_id: 'pro' },
        { value: 'Starter', external_id: 'starter' },
        { value: 'Other', external_id: 'other' }
      ]
    }
  },
  {
    external_id: 'image_role',
    label: 'Image Role',
    type: 'enum',
    datasource: {
      values: [
        { value: 'background-soft', external_id: 'background-soft' },
        { value: 'background-structured', external_id: 'background-structured' },
        { value: 'background-dynamic', external_id: 'background-dynamic' },
        { value: 'texture-paper', external_id: 'texture_paper' },
        { value: 'texture-grain', external_id: 'texture_grain' },
        { value: 'texture-grid', external_id: 'texture_grid' },
        { value: 'texture-organic', external_id: 'texture_organic' },
        { value: 'texture-industrial', external_id: 'texture_industrial' },
        { value: 'hero', external_id: 'hero' },
        { value: 'feature-card', external_id: 'feature_card' },
        { value: 'list-item', external_id: 'list_item' },
        { value: 'icon', external_id: 'icon' },
        { value: 'spot-illustration', external_id: 'spot_illustration' },
        { value: 'other', external_id: 'other' }
      ]
    }
  },
  {
    external_id: 'energy',
    label: 'Energy',
    type: 'enum',
    datasource: {
      values: [
        { value: 'low', external_id: 'low' },
        { value: 'medium', external_id: 'medium' },
        { value: 'high', external_id: 'high' }
      ]
    }
  },
  {
    external_id: 'aspect_class',
    label: 'Aspect Class',
    type: 'enum',
    datasource: {
      values: [
        { value: 'square', external_id: 'square' },
        { value: 'portrait', external_id: 'portrait' },
        { value: 'landscape', external_id: 'landscape' },
        { value: 'panorama', external_id: 'panorama' }
      ]
    }
  },
  {
    external_id: 'is_transparent',
    label: 'Is Transparent',
    type: 'enum',
    datasource: {
      values: [
        { value: 'true', external_id: 'true' },
        { value: 'false', external_id: 'false' }
      ]
    }
  },
  {
    external_id: 'lifecycle_status',
    label: 'Lifecycle Status',
    type: 'enum',
    datasource: {
      values: [
        { value: 'Draft', external_id: 'draft' },
        { value: 'Approved', external_id: 'approved' },
        { value: 'Deprecated', external_id: 'deprecated' }
      ]
    }
  },
  {
    external_id: 'quality_score',
    label: 'Quality Score',
    type: 'integer'
  },
  {
    external_id: 'asset_class',
    label: 'Asset Class',
    type: 'enum',
    datasource: {
      values: [
        { value: 'Raster', external_id: 'raster' },
        { value: 'Vector', external_id: 'vector' }
      ]
    }
  },
  {
    external_id: 'vector_type',
    label: 'Vector Type',
    type: 'enum',
    datasource: {
      values: [
        { value: 'Stroke', external_id: 'stroke' },
        { value: 'Filled', external_id: 'filled' },
        { value: 'Mixed', external_id: 'mixed' }
      ]
    }
  },
  {
    external_id: 'is_invertible',
    label: 'Is Invertible',
    type: 'enum',
    datasource: {
      values: [
        { value: 'true', external_id: 'true' },
        { value: 'false', external_id: 'false' }
      ]
    }
  },
  {
    external_id: 'is_themable',
    label: 'Is Themable',
    type: 'enum',
    datasource: {
      values: [
        { value: 'true', external_id: 'true' },
        { value: 'false', external_id: 'false' }
      ]
    }
  },
  {
    external_id: 'complexity',
    label: 'Complexity',
    type: 'enum',
    datasource: {
      values: [
        { value: 'Low', external_id: 'low' },
        { value: 'Medium', external_id: 'medium' },
        { value: 'High', external_id: 'high' }
      ]
    }
  },
  {
    external_id: 'mood',
    label: 'Mood',
    type: 'string'
  }
];

async function run() {
  console.log('--- Configuring Cloudinary Metadata Schema ---');

  for (const field of FIELDS) {
    try {
      console.log(`Checking field: ${field.label} (${field.external_id})...`);
      // Try to get existing field first
      try {
        await cloudinary.api.metadata_field_by_field_id(field.external_id);
        console.log(`  [OK] Field already exists. Updating...`);
        await cloudinary.api.update_metadata_field(field.external_id, field);
        
        // Explicitly update datasource for enums to ensure values are synced
        if (field.type === 'enum' && field.datasource) {
          console.log(`  [SYNC] Syncing datasource for ${field.external_id}...`);
          await cloudinary.api.update_metadata_field_datasource(field.external_id, field.datasource.values);
        }
      } catch (err) {
        const httpCode = err.http_code || err.error?.http_code;
        if (httpCode === 404) {
          console.log(`  [NEW] Field not found. Creating...`);
          await cloudinary.api.add_metadata_field(field);
        } else {
          throw err;
        }
      }
      console.log(`  [SUCCESS] Successfully configured ${field.external_id}`);
    } catch (err) {
      console.error(`  [ERROR] Failed to configure ${field.external_id}:`, err.message || err);
    }
  }

  console.log('\n--- Schema Configuration Complete ---');
}

run();
