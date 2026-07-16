import { NextResponse } from 'next/server';
import { isFantasyAuthed } from '../../lib/fantasyAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req) {
  return NextResponse.json(
    { authed: isFantasyAuthed(req) },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }
  );
}
