
import { S3Client } from '@aws-sdk/client-s3';

// Supabase S3 Configuration
// Endpoint format: https://[project_ref].supabase.co/storage/v1/s3

export const r2 = new S3Client({
  region: process.env.SUPABASE_REGION || 'us-east-1', // Supabase requires a region, often 'us-east-1' or where your project is
  endpoint: process.env.SUPABASE_S3_ENDPOINT!, // e.g. https://<project_id>.supabase.co/storage/v1/s3
  credentials: {
    accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Often needed for compatible S3 providers
});

// We'll keep the export name 'r2' to avoid refactoring the whole app, 
// but logically it is now the Supabase storage client.
export const R2_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'videos';
export const R2_PUBLIC_URL = process.env.SUPABASE_PUBLIC_URL || ''; 
