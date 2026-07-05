import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

// A rotating pool of prediction questions — picking a different 3 each time
// (seeded by the next match's id) keeps them varied instead of asking the
// same "who wins" question every week. Player-based ones use the curated,
// photographed roster (not every stats-only name OCR has ever created),
// since a 70-option poll button list would be unusable.
function predictionTemplates(opponent, suffix, rosterNames) {
  return [
    { q: `Will TT beat ${opponent}?`, options: ['Win', 'Loss', 'Tie / No Result'] },
    { q: `Who scores the most runs ${suffix}?`, options: rosterNames },
    { q: `Who takes the most wickets ${suffix}?`, options: rosterNames },
    { q: `Will TT post 150+ runs ${suffix}?`, options: ['Yes', 'No'] },
    { q: `Who will be Player of the Match ${suffix}?`, options: rosterNames },
    { q: `Will the match ${suffix} be a close finish?`, options: ['Yes, nail-biter', 'No, one-sided'] },
  ];
}

// Triggered right after publishing a match (no cron/scheduling needed) —
// creates 3 prediction polls for whichever match is next on the schedule,
// which then sit open for voting until that match is played. Old prediction
// polls (from whichever match was "next" before this one) are removed first
// so Voting Arena doesn't accumulate a growing pile of stale predictions —
// only the current upcoming match's polls are ever shown.
async function createPredictionPolls(afterMatchDate) {
  const { data: nextMatchRows } = await supabaseServer
    .from('tccc_matches')
    .select('id, opponent, match_date')
    .eq('team', 'TT')
    .eq('status', 'scheduled')
    .gt('match_date', afterMatchDate)
    .order('match_date', { ascending: true })
    .limit(1);

  const nextMatch = nextMatchRows?.[0];
  if (!nextMatch) return;

  const shortDate = new Date(nextMatch.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const suffix = `vs ${nextMatch.opponent} (${shortDate})`;

  const { data: existingPredictionRows } = await supabaseServer
    .from('teamhub_polls')
    .select('id')
    .ilike('poll_name', `Predict:%${suffix}`)
    .limit(1);
  if (existingPredictionRows && existingPredictionRows.length > 0) return; // already created for this match

  const { data: rosterPlayers } = await supabaseServer
    .from('tccc_players')
    .select('canonical_name')
    .eq('team', 'TT')
    .eq('active', true)
    .not('image_path', 'is', null)
    .order('canonical_name');
  const rosterNames = (rosterPlayers || []).map((p) => p.canonical_name);
  if (rosterNames.length === 0) return;

  // Clear out whatever prediction polls were made for the previous "next
  // match" — they're for a match that's now been played, so they're stale.
  await supabaseServer.from('teamhub_polls').delete().ilike('poll_name', 'Predict:%');

  const templates = predictionTemplates(nextMatch.opponent, suffix, rosterNames);
  const start = nextMatch.id % templates.length;
  const picks = [templates[start], templates[(start + 2) % templates.length], templates[(start + 4) % templates.length]];

  const rows = [];
  picks.forEach(({ q, options }) => {
    options.forEach((opt) => rows.push({ poll_name: `Predict: ${q}`, option_name: opt, votes: 0, match_date: nextMatch.match_date }));
  });
  await supabaseServer.from('teamhub_polls').insert(rows);
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

  let mvpPlayer = null;
  if (mvpPlayerId) {
    const { data } = await supabaseServer
      .from('tccc_players')
      .select('canonical_name, image_path')
      .eq('id', mvpPlayerId)
      .single();
    mvpPlayer = data || null;
  }

  if (createNews && matchStatus === 'published' && summaryText) {
    await supabaseServer.from('tccc_news_items').insert({
      team: 'TT',
      match_id: match.id,
      kind: 'match_recap',
      placement: 'main',
      tag: newsTag || `${league} Match`,
      title: resultText || `Telugu Titans vs ${opponent}`,
      body: summaryText,
      image_path: mvpPlayer?.image_path || null,
      status: 'published',
      published_at: new Date().toISOString(),
    });

    // A carousel highlight for the MVP, so the featured-player strip stays
    // populated with real standout performances instead of going stale.
    if (mvpPlayer) {
      const mvpBatting = battingRows.find((r) => r.playerId === mvpPlayerId);
      const mvpBowling = bowlingRows.find((r) => r.playerId === mvpPlayerId);
      let tag = 'MATCH IMPACT';
      if (mvpBowling?.wickets >= 3) tag = `${mvpBowling.wickets}-WICKET IMPACT`;
      else if (mvpBatting?.runs >= 40) tag = 'TOP KNOCK';
      else if (mvpBatting?.runs > 0 || mvpBowling?.wickets > 0) tag = 'MATCH WINNER';

      const highlightBody =
        mvpText?.trim() ||
        [
          mvpBatting?.runs ? `${mvpBatting.runs} off ${mvpBatting.balls} balls` : null,
          mvpBowling?.wickets ? `${mvpBowling.wickets}/${mvpBowling.runs}` : null,
        ]
          .filter(Boolean)
          .join(', ') ||
        `Standout performance vs ${opponent}.`;

      await supabaseServer.from('tccc_news_items').insert({
        team: 'TT',
        match_id: match.id,
        kind: 'player_highlight',
        placement: 'carousel',
        tag,
        title: mvpPlayer.canonical_name,
        body: highlightBody,
        image_path: mvpPlayer.image_path || null,
        status: 'published',
        published_at: new Date().toISOString(),
      });
    }
  }

  if (matchStatus === 'published') {
    const shortDate = new Date(matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const pollName = `POTM vs ${opponent} (${shortDate})`;
    const { data: existingPollRows } = await supabaseServer
      .from('teamhub_polls')
      .select('id')
      .eq('poll_name', pollName)
      .limit(1);

    if (!existingPollRows || existingPollRows.length === 0) {
      const candidateNames = [...new Set([...battingRows, ...bowlingRows].filter((r) => r.playerId).map((r) => r.name))];
      if (candidateNames.length > 0) {
        await supabaseServer.from('teamhub_polls').insert(
          candidateNames.map((name) => ({ poll_name: pollName, option_name: name, votes: 0, match_date: matchDate }))
        );
      }
    }

    await createPredictionPolls(matchDate);
  }

  return NextResponse.json({ matchId: match.id });
}
