import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Fetch unique tags and count usage (for sorting suggestions)
    const sql = `
      SELECT tag, COUNT(*) as count 
      FROM tags 
      GROUP BY tag 
      ORDER BY count DESC
    `;
    const [rows] = await db.query<any[]>(sql);
    const tags = rows.map(r => r.tag);
    
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Failed to fetch tags', error);
    return NextResponse.json([], { status: 500 });
  }
}