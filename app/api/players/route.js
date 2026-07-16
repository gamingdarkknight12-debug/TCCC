import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';
import { getRecentPlayerIds } from '../../lib/activeRoster';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request) {
  // See app/api/news/route.js for why this is needed — force-dynamic alone
  // wasn't enough to stop this route serving a frozen response in production.
  void request.headers.get('x-forwarded-for');

  const { data, error } = await supabaseServer
    .from('tccc_players')
    .select('id, canonical_name, role, skill, image_path')
    .eq('team', 'TT')
    .eq('active', true)
    .order('canonical_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recentPlayerIds = await getRecentPlayerIds(data);

  const players = data.map((p) => ({
    name: p.canonical_name,
    role: p.role,
    skill: p.skill,
    image: p.image_path,
    // Played (batted or bowled) in a real 2026 match, or manually confirmed
    // — used to split the roster into "Active Players" and "Former Players"
    // tabs, rather than showing every player who's ever worn the shirt in
    // one long list.
    recent: recentPlayerIds.has(p.id),
  }));

  return NextResponse.json(
    { players },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
