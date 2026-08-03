import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('tccc_gallery_media')
    .select('year, sub_tab');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seen = new Set();
  const folders = [];
  for (const row of data) {
    const key = `${row.year}:${row.sub_tab || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    folders.push({ year: row.year, subTab: row.sub_tab || null });
  }

  return NextResponse.json({ folders });
}
