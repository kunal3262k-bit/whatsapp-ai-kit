import { NextResponse } from 'next/server';
import { getBotActivity } from '../../../lib/bot';
import { requireAdmin } from '../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });
  return NextResponse.json(await getBotActivity());
}
