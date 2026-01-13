
import { NextRequest, NextResponse } from 'next/server';
import { r2, R2_BUCKET_NAME } from '@/lib/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { extension, contentType } = body;

    const fileId = uuidv4();
    const s3Key = `${fileId}${extension}`; // e.g., uuid.mp4

    // Generate Presigned URL for PUT
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour

    return NextResponse.json({ 
        uploadUrl, 
        fileId, 
        filename: s3Key 
    });

  } catch (error) {
    console.error('Presigned syntax error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
