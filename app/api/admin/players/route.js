import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('tccc_players')
    .select('id, canonical_name')
    .eq('team', 'TT')
    .eq('active', true)
    .order('canonical_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ players: data });
}

export async function POST(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { name } = await req.json();
  const trimmed = (name || '').trim();
  if (!trimmed) return NextResponse.json({ error: 'Player name is required.' }, { status: 400 });

  const { data, error } = await supabaseServer
    .from('tccc_players')
    .insert({ team: 'TT', canonical_name: trimmed, active: true })
    .select('id, canonical_name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: aliasError } = await supabaseServer
    .from('tccc_player_aliases')
    .insert({ player_id: data.id, alias: trimmed });

  if (aliasError) return NextResponse.json({ error: aliasError.message }, { status: 500 });

  return NextResponse.json({ player: data });
}
