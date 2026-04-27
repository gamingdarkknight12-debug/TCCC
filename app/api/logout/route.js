import { NextResponse } from 'next/server';
export async function POST() {
  const res = NextResponse.json({ message: 'Logged out.' });
  res.cookies.set('tccc_admin', '', { httpOnly: true, sameSite: 'strict', secure: true, path: '/', maxAge: 0 });
  return res;
}
