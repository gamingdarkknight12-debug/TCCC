// One-time setup: creates the public "gallery" Storage bucket used by the
// admin Gallery Photos upload feature. Idempotent — safe to re-run.
//
// Run once: node --env-file=.env.local scripts/create-gallery-bucket.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Run with: node --env-file=.env.local scripts/create-gallery-bucket.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data, error } = await supabase.storage.createBucket('gallery', {
  public: true,
  fileSizeLimit: '10MB',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

if (error) {
  if (/already exists/i.test(error.message)) {
    console.log('Bucket "gallery" already exists — nothing to do.');
  } else {
    console.error('Failed to create bucket:', error.message);
    process.exit(1);
  }
} else {
  console.log('Created bucket:', data);
}
