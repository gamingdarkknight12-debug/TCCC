import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { isFantasyAuthed } from '../../../lib/fantasyAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req) {
  if (!isFantasyAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('tccc_players')
    .select('id, canonical_name, skill')
    .eq('team', 'TT')
    .eq('active', true)
    .order('canonical_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // All-rounders are eligible for either list — a squad can legitimately
  // pick the same all-rounder's skillset for both a batting and bowling slot
  // via two different all-rounders, just not the literal same player twice
  // (enforced in POST /api/fantasy/teams).
  const batters = (data || [])
    .filter((p) => /batter|all-rounder|wicket keeper/i.test(p.skill || ''))
    .map((p) => ({ id: p.id, name: p.canonical_name }));

  const bowlers = (data || [])
    .filter((p) => /bowler|all-rounder/i.test(p.skill || ''))
    .map((p) => ({ id: p.id, name: p.canonical_name }));

  return NextResponse.json(
    { batters, bowlers },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
