import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('tccc_news_items')
    .select('id, kind, placement, tag, title, body, image_path, published_at')
    .eq('team', 'TT')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data.map((n) => ({
    id: n.id,
    kind: n.kind,
    placement: n.placement,
    tag: n.tag,
    title: n.title,
    body: n.body,
    image: n.image_path,
  }));

  return NextResponse.json({ items });
}
