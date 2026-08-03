import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request) {
  // See app/api/news/route.js for why this dummy read is needed — without
  // it, routes with no other request-dependent code have been observed
  // serving a frozen response in production despite force-dynamic.
  void request.headers.get('x-forwarded-for');

  const { data, error } = await supabaseServer.from('tccc_gallery_media').select('year, sub_tab');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seen = new Set();
  const folders = [];
  for (const row of data) {
    const key = `${row.year}:${row.sub_tab || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    folders.push({ year: row.year, subTab: row.sub_tab || null });
  }

  return NextResponse.json(
    { folders },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
