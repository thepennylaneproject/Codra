
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getCloudinary } from './src/pipeline/config/cloudinary';

async function test() {
  const cloudinary = getCloudinary();
  try {
    console.log('Testing non-existent field...');
    await cloudinary.api.metadata_field_by_field_id('non_existent_field_12345');
  } catch (error: any) {
    console.log('Caught error keys:', Object.keys(error));
    if (error.error) {
        console.log('error.error keys:', Object.keys(error.error));
        console.log('error.error.http_code:', error.error.http_code);
    }
    console.log('error.http_code:', error.http_code);
    console.log('Full Error JSON:', JSON.stringify(error, null, 2));
  }
}

test();
