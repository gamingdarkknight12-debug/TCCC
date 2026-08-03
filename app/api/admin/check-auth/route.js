import { NextResponse } from 'next/server';

function isAuthed(req) {
  const token = req.cookies.get('tccc_admin')?.value;
  return !!token && token === process.env.ADMIN_TOKEN;
}

export async function GET(req) {
  if (!isAuthed(req)) return NextResponse.json({ authed: false }, { status: 401 });
  return NextResponse.json({ authed: true });
}
