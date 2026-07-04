import { NextResponse } from 'next/server';
import { createWorker, OEM } from 'tesseract.js';
import os from 'os';

export const runtime = 'nodejs';
// Vercel's serverless functions have a read-only filesystem except /tmp —
// os.tmpdir() resolves to /tmp there, and to the OS temp dir locally.
const OCR_CACHE_PATH = os.tmpdir();

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

// Best-effort, free OCR-based extraction. Unlike an LLM, plain OCR has no
// understanding of table structure — it just returns raw text. This regex
// heuristic only tries to pull "name + a few numbers" out of each line; it
// cannot reliably find opponent/date/league/result or tell batting from
// bowling with certainty. Expect to fix names, add missing columns (4s, 6s,
// wides, etc.), and re-sort rows by hand in the review step — the raw OCR
// text is returned alongside so you can cross-check against it.
function parseOcrText(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const battingCandidates = [];
  const bowlingCandidates = [];

  for (const line of lines) {
    // Bowling-shaped: name, then a decimal "overs" figure, then runs and wickets.
    const bowlingMatch = line.match(/^([A-Za-z][A-Za-z.'\- ]{2,30}?)\s+(\d{1,2}\.\d)\s+(\d{1,3})\s+(\d{1,2})\b/);
    if (bowlingMatch) {
      bowlingCandidates.push({
        name: bowlingMatch[1].trim(),
        overs: Number(bowlingMatch[2]),
        runs: Number(bowlingMatch[3]),
        wickets: Number(bowlingMatch[4]),
        wides: 0,
        noBalls: 0,
        dots: 0,
        maidens: 0,
      });
      continue;
    }

    // Batting-shaped: name, then runs and balls, optionally 4s and 6s.
    const battingMatch = line.match(/^([A-Za-z][A-Za-z.'\- ]{2,30}?)\s+(\d{1,3})\s+(\d{1,3})(?:\s+(\d{1,2}))?(?:\s+(\d{1,2}))?\b/);
    if (battingMatch) {
      battingCandidates.push({
        name: battingMatch[1].trim(),
        runs: Number(battingMatch[2]),
        balls: Number(battingMatch[3]),
        fours: battingMatch[4] ? Number(battingMatch[4]) : 0,
        sixes: battingMatch[5] ? Number(battingMatch[5]) : 0,
        notOut: /not\s*out/i.test(line),
        dismissal: '',
      });
    }
  }

  return { battingCandidates, bowlingCandidates };
}

export async function POST(req) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  const mediaType = file.type || '';
  if (!mediaType.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Free OCR only supports images (PNG/JPG/etc), not PDFs. Please upload a screenshot or photo of the scorecard.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text;
  const worker = await createWorker('eng', OEM.LSTM_ONLY, { cachePath: OCR_CACHE_PATH });
  try {
    const result = await worker.recognize(buffer);
    text = result.data.text;
  } catch (err) {
    return NextResponse.json({ error: `OCR failed: ${err.message}` }, { status: 502 });
  } finally {
    await worker.terminate();
  }

  const { battingCandidates, bowlingCandidates } = parseOcrText(text);

  return NextResponse.json({
    parsed: {
      opponent: '',
      matchDate: '',
      league: '',
      teamScore: '',
      opponentScore: '',
      resultText: '',
      mvpGuess: '',
      draftSummary: '',
      battingTT: battingCandidates,
      bowlingTT: bowlingCandidates,
    },
    rawText: text,
  });
}
