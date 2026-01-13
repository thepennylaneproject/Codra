
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getCloudinary } from '../../src/pipeline/config/cloudinary';

const TARGET_FOLDER = 'codra';
const EXCLUDE_PREFIXES = ['samples', 'codra', 'logos', 'PLP_master_assets', 'Thumbnails'];

async function moveAssets() {
  const cloudinary = getCloudinary();
  console.log(`[Migration] Moving loose assets to '${TARGET_FOLDER}' folder...`);

  try {
    // 1. List all assets in root (recursive=false effectively, but we filter manually)
    // Cloudinary list API (resources) doesn't have a simple "root only" flag perfectly, 
    // but we can list all and check public_id.
    
    let nextCursor = null;
    let movedCount = 0;
    let errorCount = 0;

    do {
      const result: any = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        max_results: 500,
        next_cursor: nextCursor
      });

      const assetsToMove = result.resources.filter((r: any) => {
        // Check if it starts with any excluded prefix
        const isExcluded = EXCLUDE_PREFIXES.some(prefix => r.public_id.startsWith(prefix + '/'));
        // Also exclude if it IS exactly an excluded name (unlikely for folders but good practice)
        const isExactMatch = EXCLUDE_PREFIXES.includes(r.public_id);
        
        return !isExcluded && !isExactMatch;
      });

      console.log(`  Found ${assetsToMove.length} candidates in this batch.`);

      for (const asset of assetsToMove) {
        const oldId = asset.public_id;
        const newId = `${TARGET_FOLDER}/${oldId}`;
        
        console.log(`  > Moving: ${oldId} -> ${newId}`);
        
        try {
          await cloudinary.uploader.rename(oldId, newId);
          movedCount++;
        } catch (err: any) {
          console.error(`    ✗ Failed to move ${oldId}: ${err.message}`);
          errorCount++;
        }
      }

      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log('\n[Migration] Complete');
    console.log(`  Moved: ${movedCount}`);
    console.log(`  Errors: ${errorCount}`);

  } catch (error: any) {
    console.error('[Migration] Fatal error:', error);
  }
}

moveAssets();
