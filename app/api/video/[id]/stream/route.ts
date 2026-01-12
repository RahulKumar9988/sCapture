
import { NextRequest, NextResponse } from 'next/server';
import { r2, R2_BUCKET_NAME } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 1. Get Video Metadata from DB (or just guess filename if we trust ID is filename base)
  // For speed, let's assume we need to consult DB or just try extensions.
  // Actually, we need the filename from DB to know if it is .mp4 or .webm
  // Importing DB here might be slow, but let's try assuming the ID is part of the filename
  // Ideally, we pass the full filename or look it up.
  // Let's do a quick DB lookup.
  // 1. Get Video Metadata from DB 
  const { supabase } = await import('@/lib/db');
  const { data: video } = await supabase
    .from('videos')
    .select('filename')
    .eq('id', id)
    .single();

  if (!video) {
    return new NextResponse('Video not found', { status: 404 });
  }

  try {
    // 2. Fetch stream from R2/Supabase
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: video.filename,
    });
    
    // AWS SDK v3 returns a readable stream in Body
    const response = await r2.send(command);
    
    if (!response.Body) {
      return new NextResponse('Video not found in storage', { status: 404 });
    }

    // 3. Convert AWS stream to Web Stream for Next.js
    // This looks complex but basically pipes the node stream to the response
    const webStream = response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'video/mp4');
    headers.set('Content-Length', response.ContentLength?.toString() || '');
    
    // Crucial: Set Cross-Origin headers so the COOP/COEP browser doesn't block it
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    return new NextResponse(webStream, { 
        status: 200, 
        headers 
    });

  } catch (error) {
    console.error('Stream error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
