import { NextRequest, NextResponse } from 'next/server';
// import db from '@/lib/db'; // Unused in MVP

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const percent = parseFloat(body.percentage);
    
    if (isNaN(percent)) return NextResponse.json({ error: 'Invalid percentage' }, { status: 400 });

    // Analytics Logic with Supabase (Fetch -> Calc -> Update)
    const { supabase } = await import('@/lib/db');
    const { data: video } = await supabase.from('videos').select('views, completion_rate').eq('id', id).single();
    
    if (video) {
        const views = Math.max(video.views || 1, 1);
        const oldRate = video.completion_rate || 0;
        // Running Average: ((Old * (N-1)) + New) / N
        const newRate = ((oldRate * (views - 1)) + percent) / views;
        
        console.log(`Updating progress for ${id}: ${percent}% (Old: ${oldRate}%, New: ${newRate}%)`);

        const { error } = await supabase.from('videos').update({ completion_rate: newRate }).eq('id', id);
        
        if (error) {
            console.error('Progress Update Failed (RLS?):', error.message);
        } else {
            console.log('Progress updated successfully.');
        }
    } else {
        console.warn('Video not found for progress update:', id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
