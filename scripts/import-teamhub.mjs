// Re-imports scripts/teamhub-export.json (captured from the old project by
// export-teamhub.mjs) into whatever project .env.local currently points at.
// Run this against the NEW project, after running
// supabase/migrations/0000_teamhub_tables.sql there.
//
//   node --env-file=.env.local scripts/import-teamhub.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log(`Importing into ${supabaseUrl} ...`);

  const dumpPath = new URL('./teamhub-export.json', import.meta.url);
  const dump = JSON.parse(readFileSync(dumpPath, 'utf-8'));

  for (const [table, rows] of Object.entries(dump)) {
    if (!rows.length) {
      console.log(`  ${table}: nothing to import`);
      continue;
    }

    // Let new ids auto-generate; keep created_at so ordering/history is preserved.
    const cleanRows = rows.map(({ id, ...rest }) => rest);

    const { error } = await supabase.from(table).insert(cleanRows);
    if (error) throw new Error(`Failed to import ${table}: ${error.message}`);
    console.log(`  ${table}: imported ${cleanRows.length} row(s)`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
