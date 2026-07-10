import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

// Hit on a schedule (see vercel.json) purely to keep the Supabase free-tier
// project registering activity, so it doesn't auto-pause after 7 days idle.
export async function GET() {
  const { error } = await supabaseServer.from('tccc_matches').select('id').limit(1);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
