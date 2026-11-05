// Client-side Supabase instance, anon-key only - used EXCLUSIVELY for
// Realtime (the /play online multiplayer room channel). Never import this
// from a server file; app/lib/supabaseServer.js (service-role key) is the
// only Supabase client allowed to run server-side.
'use client';

import { createClient } from '@supabase/supabase-js';

// createClient() throws synchronously if either arg is missing, which would
// crash the whole /play page at module-load time (even for single-player,
// since this is a static import) if NEXT_PUBLIC_SUPABASE_ANON_KEY hasn't
// been set yet - degrade to `null` instead so only the online-multiplayer
// path breaks, with a clear message, until the key is added.
export const isRealtimeConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabaseClient = isRealtimeConfigured
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;
