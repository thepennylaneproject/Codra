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

async function check() {
  const result = await cloudinary.api.metadata_field_by_field_id('image_role');
  console.log('Current datasource:', JSON.stringify(result.datasource.values, null, 2));

  const newValues = [
    ...result.datasource.values,
    { value: 'feature-card', external_id: 'feature_card' }
  ];

  console.log('Attempting to add feature-card to datasource...');
  try {
    const updateResult = await cloudinary.api.add_metadata_field_datasource_entries(
      'image_role',
      [{ value: 'feature-card', external_id: 'feature_card' }]
    );
    console.log('Update Success:', JSON.stringify(updateResult, null, 2));
  } catch (err) {
    console.error('Update Failed:', err);
  }
}

check();
