import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET_NAME } from '@/lib/storage';
import { supabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || 'Untitled Recording';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload to R2 directly (Client already trimmed it)
    const fileId = uuidv4();
    const originalExt = path.extname(file.name);
    const fileExtension = originalExt && originalExt.length > 1 ? originalExt : '.webm';
    const s3Key = `${fileId}${fileExtension}`;
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer);

    // Dyanmic Content Type
    let contentType = file.type;
    if (!contentType) {
        contentType = fileExtension.includes('mp4') ? 'video/mp4' : 'video/webm';
    }

    console.log('Uploading to Storage...');
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    }));

    // Save to Supabase DB
    console.log('Saving to DB...');
    const { error: dbError } = await supabase
      .from('videos')
      .insert({
        id: fileId,
        title: title,
        filename: s3Key,
        views: 0,
        // Supabase expects ISO timestamp for timestamptz or big int if tailored. 
        // Assuming we switch to timestamptz default or keep number. 
        // Best practice: Use ISO string for Postgres.
        created_at: new Date().toISOString() 
      });

    if (dbError) {
        console.error('Supabase DB Error:', dbError);
        // Clean up text file? Optional.
        return NextResponse.json({ error: 'DB Insert Failed: ' + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ id: fileId });

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow larger file uploads on Vercel (up to 50MB presumably, or standard serverless limit)
// Note: In App Router, we usually don't need 'config.api.bodyParser = false' like Pages Router.
// But Vercel has a hard 4.5MB limit for Serverless Functions unless we use specific configuration or stream.
// Since we are reading the whole body into memory (req.formData()), we are bound by RAM limits.
// For larger files, we should ideally use Presigned URLs, but for this fix, we will keep it simple.
// Note: To handle large files on Vercel (>4.5MB), use Presigned URLs (Client->S3).
// The current approach (Client->Server->S3) is limited by Vercel Serverless Function payload limits.
