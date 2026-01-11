
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { getCloudinary } from './src/pipeline/config/cloudinary';

const cloudinary = getCloudinary();

console.log('Cloudinary API Methods:', Object.keys(cloudinary.api));
// Also check if there is a dedicated metadata API accessor?
