import { NextResponse } from 'next/server';

export async function POST(req) {
  const cookie = req.cookies.get('tccc_admin')?.value;
  if (!process.env.ADMIN_TOKEN || cookie !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }
  const { scoreUrl } = await req.json();
  if (!scoreUrl || !/^https?:\/\//i.test(scoreUrl)) {
    return NextResponse.json({ message: 'Please provide a valid scorecard URL.' }, { status: 400 });
  }
  return NextResponse.json({
    message: 'Scorecard link received. Next step: connect CricClubs/CricHeroes parser and database update.',
    scoreUrl
  });
}
