// Safety export: dumps the existing teamhub_* tables (from whatever project
// NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local currently
// point at) to a local JSON file, before switching projects. Read-only.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log(`Exporting from ${supabaseUrl} ...`);

  const tables = ['teamhub_polls', 'teamhub_locker_notes', 'teamhub_captain_notes', 'teamhub_roast_names'];
  const dump = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`  ${table}: ${error.message} (skipping)`);
      dump[table] = [];
      continue;
    }
    dump[table] = data;
    console.log(`  ${table}: ${data.length} row(s)`);
  }

  const outPath = new URL('./teamhub-export.json', import.meta.url);
  writeFileSync(outPath, JSON.stringify(dump, null, 2));
  console.log(`\nSaved to scripts/teamhub-export.json`);
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
