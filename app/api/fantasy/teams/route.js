import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { isFantasyAuthed } from '../../../lib/fantasyAuth';
import { isFantasyLocked } from '../../../lib/matchLock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const PICK_SELECT = `
  id, owner_name, season,
  batter1:batter1_id (id, canonical_name),
  batter2:batter2_id (id, canonical_name),
  bowler1:bowler1_id (id, canonical_name),
  bowler2:bowler2_id (id, canonical_name),
  captain:captain_player_id (id, canonical_name),
  vice_captain:vice_captain_player_id (id, canonical_name)
`;

export async function GET(req) {
  if (!isFantasyAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: teams, error } = await supabaseServer
    .from('fantasy_teams')
    .select(PICK_SELECT)
    .order('owner_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: scores, error: scoreError } = await supabaseServer
    .from('fantasy_scores')
    .select('fantasy_team_id, points');
  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 });

  const pointsByTeam = new Map();
  const lockedTeams = new Set();
  for (const s of scores || []) {
    pointsByTeam.set(s.fantasy_team_id, (pointsByTeam.get(s.fantasy_team_id) || 0) + Number(s.points || 0));
    lockedTeams.add(s.fantasy_team_id);
  }

  const result = (teams || []).map((t) => ({
    id: t.id,
    ownerName: t.owner_name,
    batter1Id: t.batter1?.id,
    batter2Id: t.batter2?.id,
    bowler1Id: t.bowler1?.id,
    bowler2Id: t.bowler2?.id,
    captainId: t.captain?.id,
    viceCaptainId: t.vice_captain?.id,
    picks: [t.batter1, t.batter2, t.bowler1, t.bowler2].map((p) => p?.canonical_name),
    captain: t.captain?.canonical_name,
    viceCaptain: t.vice_captain?.canonical_name,
    points: pointsByTeam.get(t.id) || 0,
    locked: lockedTeams.has(t.id),
  }));

  return NextResponse.json(
    { teams: result },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}

export async function POST(req) {
  if (!isFantasyAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  // Belt-and-suspenders: the UI already hides the form while locked, but a
  // direct API call shouldn't be able to bypass that.
  const lock = await isFantasyLocked();
  if (lock.locked) return NextResponse.json({ error: lock.reason }, { status: 409 });

  const body = await req.json();
  const { id, ownerName, batter1Id, batter2Id, bowler1Id, bowler2Id, captainId, viceCaptainId } = body;

  if (!ownerName?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  if (!batter1Id || !batter2Id || !bowler1Id || !bowler2Id) {
    return NextResponse.json({ error: 'Pick 2 batters and 2 bowlers.' }, { status: 400 });
  }
  if (batter1Id === batter2Id) return NextResponse.json({ error: 'Pick two different batters.' }, { status: 400 });
  if (bowler1Id === bowler2Id) return NextResponse.json({ error: 'Pick two different bowlers.' }, { status: 400 });

  const squad = [batter1Id, batter2Id, bowler1Id, bowler2Id];
  if (!captainId || !viceCaptainId) return NextResponse.json({ error: 'Pick a Captain and Vice-Captain.' }, { status: 400 });
  if (!squad.includes(captainId)) return NextResponse.json({ error: 'Captain must be one of your 4 picks.' }, { status: 400 });
  if (!squad.includes(viceCaptainId)) return NextResponse.json({ error: 'Vice-Captain must be one of your 4 picks.' }, { status: 400 });
  if (captainId === viceCaptainId) return NextResponse.json({ error: 'Captain and Vice-Captain must be different players.' }, { status: 400 });

  const fields = {
    owner_name: ownerName.trim(),
    batter1_id: batter1Id,
    batter2_id: batter2Id,
    bowler1_id: bowler1Id,
    bowler2_id: bowler2Id,
    captain_player_id: captainId,
    vice_captain_player_id: viceCaptainId,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    // Editing an existing team — refuse once it has any score row (locked).
    const { data: existingScores } = await supabaseServer.from('fantasy_scores').select('id').eq('fantasy_team_id', id).limit(1);
    if (existingScores && existingScores.length > 0) {
      return NextResponse.json({ error: 'This squad is locked — it has already earned points.' }, { status: 409 });
    }
    const { error } = await supabaseServer.from('fantasy_teams').update(fields).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id });
  }

  const { data, error } = await supabaseServer.from('fantasy_teams').insert(fields).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
