import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET_NAME } from '@/lib/storage';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Helper to save temp file removed as no longer needed
// Helper to trim video removed as no longer needed

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
    // Use the extension from the uploaded file (.mp4 or .webm)
    // If client sent 'recording.webm' but it is mp4, we should trust the blob type or name
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

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    }));

    // Save to DB
    const insertStmt = db.prepare(`
      INSERT INTO videos (id, title, filename, views, created_at)
      VALUES (?, ?, ?, 0, ?)
    `);
    
    insertStmt.run(fileId, title, s3Key, Date.now());

    return NextResponse.json({ id: fileId });

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
