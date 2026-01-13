
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, filename, trim_start, trim_end } = body;

    if (!id || !filename) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Insert directly into DB
    const { error } = await supabase
      .from('videos')
      .insert({
        id,
        title: title || 'Untitled Recording',
        filename,
        views: 0,
        trim_start: trim_start || 0,
        trim_end: trim_end || null,
        created_at: new Date().toISOString() 
      });

    if (error) {
        console.error('DB Insert Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });

  } catch (error) {
    console.error('Save Handler Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
