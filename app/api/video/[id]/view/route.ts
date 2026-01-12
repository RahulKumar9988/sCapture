import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Ideally use: await supabase.rpc('increment_video_view', { video_id: id });
    // For MVP without creating functions, we will just read and write (race condition risk but ok for now)
    
    // BETTER WAY: Use the RPC if you create it. 
    // SQL: create function increment_video_view(video_id uuid) returns void as $$ update videos set views = views + 1 where id = video_id; $$ language sql;
    
    const { error } = await supabase.rpc('increment_video_view', { video_id: id });
    
    if (error) {
        console.warn('View RPC failed, falling back to manual update:', error.message);
        // Fallback: Get current views -> Update
        // Note: Not atomic, but fine for MVP
        const { data } = await supabase.from('videos').select('views').eq('id', id).single();
        if (data) {
            await supabase.from('videos').update({ views: (data.views || 0) + 1 }).eq('id', id);
        }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
