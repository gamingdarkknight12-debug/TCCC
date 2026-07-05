import { NextResponse } from 'next/server';
import { createWorker, OEM } from 'tesseract.js';
import { Jimp, JimpMime } from 'jimp';
import os from 'os';

export const runtime = 'nodejs';
// Vercel's serverless functions have a read-only filesystem except /tmp —
// os.tmpdir() resolves to /tmp there, and to the OS temp dir locally.
const OCR_CACHE_PATH = os.tmpdir();

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

// Tesseract's default model assumes normal-sized dark text on a light
// background. Real-world scorecard screenshots often defeat that: forwarded/
// re-compressed images shrink the text well below a readable pixel height,
// and dark-mode UIs (light text on a navy/black card) are the opposite of
// what the model expects. Upscaling small images and auto-inverting dark
// ones before OCR fixes both without needing the user to pre-edit anything.
async function preprocessForOcr(buffer) {
  let img;
  try {
    img = await Jimp.read(buffer);
  } catch {
    return buffer; // not decodable by Jimp — hand the original to Tesseract as-is
  }

  const MIN_WIDTH = 1400;
  if (img.bitmap.width < MIN_WIDTH) {
    img.resize({ w: MIN_WIDTH });
  }

  img.greyscale();

  let total = 0;
  const { data, width, height } = img.bitmap;
  for (let i = 0; i < data.length; i += 4) total += data[i]; // R=G=B after greyscale
  const avgBrightness = total / (width * height);
  if (avgBrightness < 128) img.invert();

  img.normalize();
  img.contrast(0.15);

  return img.getBuffer(JimpMime.png);
}

// Lines that are table furniture, not player rows — skip these outright.
const NON_PLAYER_LINE = /total|extras|fall of wickets|\btoss\b|umpire|\bpoints\b|match (number|cancelled|abandoned)|played at|\bnot out\b$/i;
const HEADER_TOKENS = new Set(['o', 'm', 'r', 'w', 'econ', 'b', '4s', '6s', 'sr']);

const MAX_NAME_TOKENS = 5; // longest real roster names run ~4 words

// A player name is one or more Capitalized words at the start of the line.
// Dismissal text ("c Ishpreet Singh, b Ayush Sharma", "run out ...", "not out")
// normally starts with a lowercase marker word, so stopping at the first
// non-capitalized token cleanly separates the two — except when OCR drops
// that single-letter marker (very easy to lose, e.g. a lone "c"), in which
// case the fielder's name ("Manish T b Vignesh G") is also capitalized and
// would otherwise get swallowed into the batter's name. Cross-checking
// against the known roster resolves that: if some prefix of the leading
// capitalized tokens exactly matches a real player, that's almost certainly
// the actual boundary, even if more capitalized-looking tokens follow.
// Returns { name, tokenCount } — tokenCount is how many whitespace-separated
// tokens of the original line the name consumed, so the caller can find the
// exact remainder of the line by token position rather than string length
// (which would misalign once `name` is the roster's canonical spelling
// instead of verbatim OCR text).
function extractName(line, rosterNames = []) {
  const tokens = line.split(/\s+/);
  const capTokens = [];
  for (const raw of tokens) {
    // Circular avatar icons next to each name in the source screenshot often
    // bleed a stray symbol (quote marks, dots, etc.) onto the front of the
    // first word — strip leading as well as trailing junk, or a single bad
    // character silently drops the entire row.
    const t = raw.replace(/^[^A-Za-z]+/, '').replace(/[^A-Za-z.'-]+$/, '');
    if (!/^[A-Z][A-Za-z.'-]*$/.test(t)) break;
    capTokens.push(t);
    if (capTokens.length >= MAX_NAME_TOKENS) break;
  }
  if (capTokens.length === 0) return null;

  if (rosterNames.length > 0) {
    const lowerRoster = rosterNames.map((n) => n.toLowerCase());
    for (let len = capTokens.length; len >= 1; len--) {
      const candidate = capTokens.slice(0, len).join(' ');
      const idx = lowerRoster.indexOf(candidate.toLowerCase());
      if (idx !== -1) return { name: rosterNames[idx], tokenCount: len };
    }
  }

  return { name: capTokens.join(' '), tokenCount: capTokens.length };
}

// Tesseract's plain text output reads by "paragraph"/"block", and a wide gap
// between the name+dismissal column and the far-right R/B/4s/6s/SR columns
// often gets classified as two separate blocks — so the same visual row ends
// up split across unrelated lines of the text output (or one side vanishes
// entirely from a name-first-then-numbers ordering). Word-level TSV output
// carries each word's exact bounding box regardless of what block Tesseract
// assigned it to, so we can reconstruct rows ourselves purely by vertical
// (y) position — which is what actually reflects the table's visual rows —
// instead of trusting Tesseract's paragraph grouping for wide tables.
function reconstructLinesFromTsv(tsv) {
  if (!tsv) return '';
  const words = [];
  for (const row of tsv.split('\n').slice(1)) {
    const cols = row.split('\t');
    if (cols.length < 12) continue;
    const [level, , , , , , left, top, width, height] = cols;
    if (Number(level) !== 5) continue; // word-level rows only
    const text = cols.slice(11).join('\t').trim();
    if (!text) continue;
    words.push({ left: Number(left), top: Number(top), width: Number(width), height: Number(height), text });
  }
  if (words.length === 0) return '';

  words.sort((a, b) => a.top + a.height / 2 - (b.top + b.height / 2));

  const lines = [];
  let current = [];
  let currentCenter = null;
  for (const w of words) {
    const center = w.top + w.height / 2;
    if (current.length === 0) {
      current.push(w);
      currentCenter = center;
      continue;
    }
    const tolerance = Math.max(w.height, current[0].height) * 0.6;
    if (Math.abs(center - currentCenter) <= tolerance) {
      current.push(w);
      currentCenter = (currentCenter * (current.length - 1) + center) / current.length;
    } else {
      lines.push(current);
      current = [w];
      currentCenter = center;
    }
  }
  if (current.length) lines.push(current);

  return lines
    .map((row) => row.sort((a, b) => a.left - b.left).map((w) => w.text).join(' '))
    .join('\n');
}

function extractNumbers(str) {
  // Parenthetical notes like "(3w)" get pulled separately — strip them here
  // so they don't get misread as extra stat columns.
  const cleaned = str.replace(/\([^)]*\)/g, ' ');
  const matches = cleaned.match(/\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

// Best-effort, free OCR-based extraction. Unlike an LLM, plain OCR has no
// understanding of table structure — it just returns raw text, one row per
// line (when the columns aren't too far apart for Tesseract to keep on one
// line — badly misaligned tables can still split a row across lines, which
// this can't recover from). Rather than requiring a whole row to match a
// rigid pattern — which threw away the entire row over one misread column —
// this pulls out a name plus whatever numbers are actually there and fills
// in the rest as 0, leaving them for you to fix in the review step.
//
// `section` ('batting' | 'bowling') is told to us by the caller — the admin
// UI uses two separate upload slots, one per table, so every row in a given
// scan is unambiguously that type. That's far more reliable than guessing
// from OCR'd section headers, which broke easily on a misread "Bowling" label.
function parseOcrText(rawText, section, rosterNames = []) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates = [];

  for (const line of lines) {
    const tokens = line.split(/\s+/);
    if (tokens.every((t) => HEADER_TOKENS.has(t.toLowerCase()))) continue;
    if (NON_PLAYER_LINE.test(line)) continue;

    const extracted = extractName(line, rosterNames);
    if (!extracted || extracted.name.trim().length < 3) continue;
    const { name } = extracted;

    const rest = tokens.slice(extracted.tokenCount).join(' ').trim();
    const widesMatch = rest.match(/\((\d+)\s*w\)/i);
    const noBallsMatch = rest.match(/\((\d+)\s*nb\)/i);
    const nums = extractNumbers(rest);
    const notOut = /not\s*out/i.test(rest);

    if (nums.length === 0 && !notOut) continue; // nothing usable on this line at all

    if (section === 'bowling') {
      const [overs = 0, n1 = 0, n2 = 0, n3] = nums;
      // Full row is [overs, maidens, runs, wickets]; degrade gracefully when
      // OCR only picked up some of them.
      const [maidens, runs, wickets] =
        nums.length >= 4 ? [n1, n2, n3] : nums.length === 3 ? [0, n1, n2] : nums.length === 2 ? [0, n1, 0] : [0, 0, 0];
      candidates.push({
        name,
        overs,
        runs,
        wickets,
        wides: widesMatch ? Number(widesMatch[1]) : 0,
        noBalls: noBallsMatch ? Number(noBallsMatch[1]) : 0,
        dots: 0,
        maidens,
      });
    } else {
      const dismissalText = rest.match(/^([^\d]*)/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const [runs = 0, balls = 0, fours = 0, sixes = 0] = nums;
      candidates.push({
        name,
        runs,
        balls,
        fours,
        sixes,
        notOut,
        dismissal: notOut ? 'not out' : dismissalText,
      });
    }
  }

  return candidates;
}

export async function POST(req) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const section = formData.get('section');
  let rosterNames = [];
  try {
    rosterNames = JSON.parse(formData.get('roster') || '[]');
  } catch {
    rosterNames = [];
  }

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }
  if (section !== 'batting' && section !== 'bowling') {
    return NextResponse.json({ error: 'section must be "batting" or "bowling".' }, { status: 400 });
  }

  const mediaType = file.type || '';
  if (!mediaType.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Free OCR only supports images (PNG/JPG/etc), not PDFs. Please upload a screenshot or photo of the scorecard.' },
      { status: 400 }
    );
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const buffer = await preprocessForOcr(rawBuffer);

  let text;
  const worker = await createWorker('eng', OEM.LSTM_ONLY, { cachePath: OCR_CACHE_PATH });
  try {
    const result = await worker.recognize(buffer, {}, { text: true, tsv: true });
    text = reconstructLinesFromTsv(result.data.tsv) || result.data.text;
  } catch (err) {
    return NextResponse.json({ error: `OCR failed: ${err.message}` }, { status: 502 });
  } finally {
    await worker.terminate();
  }

  const candidates = parseOcrText(text, section, rosterNames);

  return NextResponse.json({
    section,
    candidates,
    rawText: text,
  });
}
