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

async function reset() {
  console.log('--- Resetting image_role field ---');
  try {
    console.log('Deleting image_role...');
    await cloudinary.api.delete_metadata_field('image_role');
    console.log('Deleted.');
  } catch (err) {
    console.log('Delete failed (maybe already gone):', err.message);
  }

  const field = {
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
  };

  console.log('Re-creating image_role...');
  const result = await cloudinary.api.add_metadata_field(field);
  console.log('Success:', JSON.stringify(result, null, 2));
}

reset();
