#!/usr/bin/env tsx
/**
 * Setup Cloudinary Structured Metadata Fields
 *
 * Creates all required structured metadata fields in Cloudinary.
 * Run this once to initialize the asset taxonomy.
 *
 * Usage:
 *   tsx scripts/pipeline/setup-cloudinary.ts
 */

import { getCloudinary } from '../../src/pipeline/config/cloudinary';
import { CLOUDINARY_METADATA_SCHEMA } from '../../src/pipeline/types/metadata';

async function setupCloudinaryMetadata() {
  console.log('[Setup] Initializing Cloudinary structured metadata fields...\n');

  const cloudinary = getCloudinary();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const field of CLOUDINARY_METADATA_SCHEMA) {
    try {
      console.log(`[Setup] Processing field: ${field.external_id}`);

      // Check if field already exists
      let exists = false;
      try {
        // Cloudinary SDK: get_metadata_field() throws 404 if not found
        await cloudinary.api.get_metadata_field(field.external_id);
        exists = true;
      } catch (error: any) {
        // 404 = field doesn't exist (expected for new fields)
        if (error.http_code !== 404 && error.error?.http_code !== 404) {
          throw error;
        }
      }

      if (exists) {
        console.log(`  ⊙ Already exists, skipping`);
        skipped++;
        continue;
      }

      // Create the field
      const payload: any = {
        external_id: field.external_id,
        type: field.type,
        label: field.label,
      };

      if (field.mandatory !== undefined) {
        payload.mandatory = field.mandatory;
      }

      if (field.default_value !== undefined) {
        payload.default_value = field.default_value;
      }

      if (field.datasource) {
        payload.datasource = field.datasource;
      }

      await cloudinary.api.add_metadata_field(payload);

      console.log(`  ✓ Created successfully`);
      created++;
    } catch (error: any) {
      console.error(
        `  ✗ Failed: ${error.message || JSON.stringify(error)}`,
      );
      failed++;
    }

    console.log('');
  }

  console.log('\n[Setup] Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (existing): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${CLOUDINARY_METADATA_SCHEMA.length}`);

  if (failed > 0) {
    console.error('\n[Setup] ✗ Setup completed with errors');
    process.exit(1);
  }

  console.log('\n[Setup] ✓ Setup complete!');
  console.log('\nNext steps:');
  console.log('  1. Create upload presets in Cloudinary UI or via API');
  console.log('  2. Upload assets using the presets');
  console.log('  3. Run enrichment: tsx scripts/pipeline/enrich-assets.ts');
}

// Run
setupCloudinaryMetadata().catch((error) => {
  console.error('[Setup] Fatal error:', error);
  process.exit(1);
});
