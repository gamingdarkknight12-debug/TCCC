import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = () =>
    supabaseServer
      .from('tccc_news_items')
      .select('id, kind, placement, tag, title, body, image_path, published_at')
      .eq('team', 'TT')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

  // Carousel highlights accumulate indefinitely (it's meant to be a running
  // showcase of standout performances), while the main/small flow grid stays
  // capped to recent items — otherwise a full season of match recaps would
  // pile up into an ever-growing wall of cards.
  const [{ data: carouselData, error: carouselError }, { data: flowData, error: flowError }] = await Promise.all([
    base().eq('placement', 'carousel'),
    base().in('placement', ['main', 'small']).limit(8),
  ]);

  if (carouselError) return NextResponse.json({ error: carouselError.message }, { status: 500 });
  if (flowError) return NextResponse.json({ error: flowError.message }, { status: 500 });

  const data = [...carouselData, ...flowData].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  const items = data.map((n) => ({
    id: n.id,
    kind: n.kind,
    placement: n.placement,
    tag: n.tag,
    title: n.title,
    body: n.body,
    image: n.image_path,
  }));

  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
