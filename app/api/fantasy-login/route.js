import { NextResponse } from 'next/server';

export async function POST(req) {
  const { password } = await req.json();
  const expected = process.env.FANTASY_PASSWORD;
  const token = process.env.FANTASY_TOKEN;
  if (!expected || !token) return NextResponse.json({ message: 'Fantasy env variables not set.' }, { status: 500 });
  if (password !== expected) return NextResponse.json({ message: 'Invalid password.' }, { status: 401 });
  const res = NextResponse.json({ message: 'Logged in.' });
  res.cookies.set('tccc_fantasy', token, { httpOnly: true, sameSite: 'strict', secure: true, path: '/', maxAge: 60 * 60 * 8 });
  return res;
}
