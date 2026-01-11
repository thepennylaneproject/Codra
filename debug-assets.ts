
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getCloudinary } from './src/pipeline/config/cloudinary';

async function debugAssets() {
  const cloudinary = getCloudinary();
  console.log('Cloud Name:', cloudinary.config().cloud_name);
  
  console.log('Listing root folders...');
  try {
      const folders = await cloudinary.api.root_folders();
      console.log('Root folders:', folders.folders.map((f: any) => f.name));
  } catch(e) {
      console.log('Error listing folders:', e.message);
  }

  console.log('\nListing first 10 assets (no prefix)...');
  try {
      const resources = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        max_results: 10
      });
      
      if (resources.resources.length === 0) {
          console.log('No assets found in account.');
      } else {
          resources.resources.forEach((r: any) => {
              console.log(`- Public ID: ${r.public_id}, Folder: ${r.folder}, Format: ${r.format}`);
          });
      }
  } catch(e) {
      console.log('Error listing resources:', e.message);
  }
}

debugAssets();
