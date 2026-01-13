
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getCloudinary } from './src/pipeline/config/cloudinary';

async function debugCodraFolder() {
  const cloudinary = getCloudinary();
  
  console.log('Listing assets in "codra" folder...');
  try {
      const resources = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        prefix: 'codra', // Try without slash
        max_results: 10
      });
      
      console.log(`Found ${resources.resources.length} assets.`);
      resources.resources.forEach((r: any) => {
          console.log(`- ${r.public_id} (${r.format})`);
      });
  } catch(e) {
      console.log('Error listing resources:', e.message);
  }
}

debugCodraFolder();
