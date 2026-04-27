import { NextResponse } from 'next/server';

export async function POST(req) {
  const token = req.cookies.get('tccc_admin')?.value;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json(
      { message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  const { scoreUrl } = await req.json();

  if (!scoreUrl) {
    return NextResponse.json(
      { message: 'Scorecard URL is required.' },
      { status: 400 }
    );
  }

  // TODO:
  // Later this should delete records from database/storage
  // where importedScore.scoreUrl === scoreUrl

  return NextResponse.json({
    message: `Delete request received for: ${scoreUrl}. Database delete logic can be connected next.`,
  });
}