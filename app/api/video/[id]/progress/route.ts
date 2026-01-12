
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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
    
    const stmt = db.prepare(`
      UPDATE videos 
      SET completion_rate = ((completion_rate * (views - 1)) + ?) / MAX(views, 1)
      WHERE id = ?
    `);
    
    stmt.run(percent, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
