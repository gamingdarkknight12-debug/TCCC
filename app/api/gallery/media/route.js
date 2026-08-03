import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request) {
  void request.headers.get('x-forwarded-for');

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const subTab = searchParams.get('subTab') || '';

  if (!year) return NextResponse.json({ error: 'year is required.' }, { status: 400 });

  let query = supabaseServer
    .from('tccc_gallery_media')
    .select('media_type, storage_path, caption, created_at')
    .eq('year', year)
    .order('created_at', { ascending: true });

  query = subTab ? query.eq('sub_tab', subTab) : query.is('sub_tab', null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const media = data.map((row) => ({
    type: row.media_type,
    src: supabaseServer.storage.from('gallery').getPublicUrl(row.storage_path).data.publicUrl,
    caption: row.caption || undefined,
  }));

  return NextResponse.json(
    { media },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
