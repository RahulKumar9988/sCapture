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

    // Update running average (simplified)
    // We assume 'views' tracks the number of samples.
    // Logic: NewAvg = ((OldAvg * (Views-1)) + NewVal) / Views
    // But since we increment views on load, 'views' is already N.
    // So ((OldAvg * (Views-1)) + NewVal) / Views
    
    // Simplified: For Supabase MVP, avoiding complex math update via simple client query.
    // If you want to track this, use a separate table 'video_progress' and aggregate it.
    // For now, disabling the direct update to main table to prevent errors.
    
    /* 
    const stmt = db.prepare(`
       UPDATE videos 
       SET completion_rate = ((completion_rate * (views - 1)) + ?) / MAX(views, 1)
       WHERE id = ?
     `);
    stmt.run(percent, id);
    */
    
    return NextResponse.json({ success: true, warning: "Progress tracking disabled in MVP" });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
