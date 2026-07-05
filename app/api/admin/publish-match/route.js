import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

export async function POST(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await req.json();
  const {
    matchId,
    status,
    league,
    season,
    opponent,
    matchDate,
    matchTime,
    ground,
    homeAway,
    teamScore,
    opponentScore,
    resultText,
    resultType,
    summaryText,
    mvpText,
    mvpPlayerId,
    sourceType,
    sourceFileName,
    rawExtraction,
    battingRows = [],
    bowlingRows = [],
    createNews,
    newsTag,
  } = body;

  if (!opponent || !matchDate || !league) {
    return NextResponse.json({ error: 'Opponent, match date, and league are required.' }, { status: 400 });
  }

  const matchStatus = status === 'draft' ? 'draft' : 'published';

  const matchFields = {
    league,
    season: season || new Date(matchDate).getFullYear(),
    opponent,
    match_date: matchDate,
    match_time: matchTime || null,
    ground: ground || null,
    home_away: homeAway || null,
    status: matchStatus,
    source_type: sourceType || 'manual',
    source_file_name: sourceFileName || null,
    result_text: resultText || null,
    result_type: resultType || null,
    summary_text: summaryText || null,
    mvp_text: mvpText || null,
    mvp_player_id: mvpPlayerId || null,
    team_score: teamScore || null,
    opponent_score: opponentScore || null,
    raw_extraction: rawExtraction || null,
  };

  let match;
  if (matchId) {
    // Attaching a scorecard to an existing (usually scheduled) match — update
    // it in place and clear any prior innings rows so re-imports don't duplicate.
    const { data, error } = await supabaseServer
      .from('tccc_matches')
      .update(matchFields)
      .eq('id', matchId)
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    match = data;

    await supabaseServer.from('tccc_batting_innings').delete().eq('match_id', matchId);
    await supabaseServer.from('tccc_bowling_innings').delete().eq('match_id', matchId);
  } else {
    const { data, error } = await supabaseServer
      .from('tccc_matches')
      .insert({ team: 'TT', ...matchFields })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    match = data;
  }

  const battingInsert = battingRows.map((r) => ({
    match_id: match.id,
    player_id: r.playerId || null,
    unmatched_name: r.playerId ? null : (r.name || null),
    runs: r.runs || 0,
    balls: r.balls || 0,
    fours: r.fours || 0,
    sixes: r.sixes || 0,
    not_out: !!r.notOut,
    dismissal: r.dismissal || null,
  }));

  const bowlingInsert = bowlingRows.map((r) => ({
    match_id: match.id,
    player_id: r.playerId || null,
    unmatched_name: r.playerId ? null : (r.name || null),
    overs: r.overs || 0,
    runs: r.runs || 0,
    wickets: r.wickets || 0,
    wides: r.wides || 0,
    no_balls: r.noBalls || 0,
    dots: r.dots ?? null,
    maidens: r.maidens ?? null,
  }));

  if (battingInsert.length) {
    const { error } = await supabaseServer.from('tccc_batting_innings').insert(battingInsert);
    if (error) return NextResponse.json({ error: `Match saved, but batting rows failed: ${error.message}`, matchId: match.id }, { status: 500 });
  }

  if (bowlingInsert.length) {
    const { error } = await supabaseServer.from('tccc_bowling_innings').insert(bowlingInsert);
    if (error) return NextResponse.json({ error: `Match saved, but bowling rows failed: ${error.message}`, matchId: match.id }, { status: 500 });
  }

  if (createNews && matchStatus === 'published' && summaryText) {
    let imagePath = null;
    if (mvpPlayerId) {
      const { data: mvpPlayer } = await supabaseServer
        .from('tccc_players')
        .select('image_path')
        .eq('id', mvpPlayerId)
        .single();
      imagePath = mvpPlayer?.image_path || null;
    }

    await supabaseServer.from('tccc_news_items').insert({
      team: 'TT',
      match_id: match.id,
      kind: 'match_recap',
      placement: 'main',
      tag: newsTag || `${league} Match`,
      title: resultText || `Telugu Titans vs ${opponent}`,
      body: summaryText,
      image_path: imagePath,
      status: 'published',
      published_at: new Date().toISOString(),
    });
  }

  if (matchStatus === 'published') {
    const pollName = `Player of the Match — TT vs ${opponent} (${matchDate})`;
    const { data: existingPollRows } = await supabaseServer
      .from('teamhub_polls')
      .select('id')
      .eq('poll_name', pollName)
      .limit(1);

    if (!existingPollRows || existingPollRows.length === 0) {
      const candidateNames = [...new Set([...battingRows, ...bowlingRows].filter((r) => r.playerId).map((r) => r.name))];
      if (candidateNames.length > 0) {
        await supabaseServer.from('teamhub_polls').insert(
          candidateNames.map((name) => ({ poll_name: pollName, option_name: name, votes: 0 }))
        );
      }
    }
  }

  return NextResponse.json({ matchId: match.id });
}
