import { NextResponse } from 'next/server';
import { Jimp, JimpMime } from 'jimp';
import { supabaseServer } from '../../../lib/supabaseServer';

export const runtime = 'nodejs';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 68;

// Best-effort compression matching the historical manual convention (resize
// to ~1280px max dimension, JPEG quality 68). Falls back to the original
// buffer on anything Jimp can't decode (e.g. HEIC from an iPhone) rather
// than failing the whole upload — same pattern as preprocessForOcr in
// parse-scorecard/route.js.
async function compressImage(buffer) {
  let img;
  try {
    img = await Jimp.read(buffer);
  } catch {
    return { buffer, contentType: null };
  }

  if (img.bitmap.width > MAX_DIMENSION || img.bitmap.height > MAX_DIMENSION) {
    img.scaleToFit({ w: MAX_DIMENSION, h: MAX_DIMENSION });
  }

  const out = await img.getBuffer(JimpMime.jpeg, { quality: JPEG_QUALITY });
  return { buffer: out, contentType: 'image/jpeg' };
}

export async function POST(req) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  const year = formData.get('year');
  const subTab = formData.get('subTab') || '';
  const caption = formData.get('caption') || null;

  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, error: 'No file uploaded.' }, { status: 400 });
  }
  if (!year) {
    return NextResponse.json({ ok: false, error: 'Year is required.' }, { status: 400 });
  }
  if (!(file.type || '').startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'Only image uploads are supported right now.' }, { status: 400 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, contentType } = await compressImage(rawBuffer);
  const finalContentType = contentType || file.type || 'application/octet-stream';
  const ext = finalContentType === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg');

  const folderSegment = subTab ? slugify(subTab) : 'general';
  const path = `${year}/${folderSegment}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabaseServer.storage
    .from('gallery')
    .upload(path, buffer, { contentType: finalContentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await supabaseServer.from('tccc_gallery_media').insert({
    year: String(year),
    sub_tab: subTab || null,
    media_type: 'image',
    storage_path: path,
    caption,
  });

  if (insertError) {
    // Storage object was already written — leave it rather than risk a
    // second failure trying to clean it up; an orphaned file is harmless.
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseServer.storage.from('gallery').getPublicUrl(path);

  return NextResponse.json({ ok: true, path, publicUrl: publicUrlData.publicUrl });
}
