import { NextResponse } from 'next/server';
import { isFantasyAuthed } from '../../../lib/fantasyAuth';
import { isFantasyLocked, getUpcomingMatches } from '../../../lib/matchLock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req) {
  if (!isFantasyAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  let status, upcomingMatches;
  try {
    status = await isFantasyLocked();
    upcomingMatches = await getUpcomingMatches();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ...status, upcomingMatches },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
