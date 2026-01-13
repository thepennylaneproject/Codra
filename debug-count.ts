
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getCloudinary } from './src/pipeline/config/cloudinary';

async function countAssets() {
  const cloudinary = getCloudinary();
  
  console.log('Counting all assets in Cloudinary...\n');
  
  // Count by resource type
  let totalImages = 0;
  let rasterCount = 0;
  let svgCount = 0;
  let nextCursor = undefined;
  
  do {
    const result: any = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'codra',
      max_results: 500,
      next_cursor: nextCursor
    });
    
    for (const r of result.resources) {
      totalImages++;
      if (r.format === 'svg') {
        svgCount++;
      } else {
        rasterCount++;
      }
    }
    
    nextCursor = result.next_cursor;
    console.log(`  Fetched batch... (${totalImages} so far)`);
  } while (nextCursor);
  
  console.log('\n=== Asset Count Summary ===');
  console.log(`Total images in codra/: ${totalImages}`);
  console.log(`  Raster (processable): ${rasterCount}`);
  console.log(`  SVG (skipped by AI):  ${svgCount}`);
  
  // Also check other folders
  console.log('\n=== Other Folders ===');
  const folders = await cloudinary.api.root_folders();
  for (const folder of folders.folders) {
    if (folder.name === 'codra') continue;
    
    try {
      const res: any = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        prefix: folder.name,
        max_results: 1
      });
      console.log(`  ${folder.name}: ${res.total_count || 'unknown'} assets`);
    } catch (e) {
      console.log(`  ${folder.name}: (error counting)`);
    }
  }
}

countAssets();
