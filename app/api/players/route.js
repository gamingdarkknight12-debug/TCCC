import { NextResponse } from 'next/server';
import { supabaseServer } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('tccc_players')
    .select('canonical_name, role, skill, image_path')
    .eq('team', 'TT')
    .eq('active', true)
    .order('canonical_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const players = data.map((p) => ({
    name: p.canonical_name,
    role: p.role,
    skill: p.skill,
    image: p.image_path,
  }));

  return NextResponse.json({ players });
}
