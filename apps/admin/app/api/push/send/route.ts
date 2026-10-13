import { NextResponse } from 'next/server';
import { pushEnv, sendToAll, tableHint } from '../../../../lib/push';
import { requireAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });

  if (!pushEnv().configured) {
    return NextResponse.json(
      {
        error: 'Push not configured',
        hint: 'Set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY on the admin project, then redeploy.',
      },
      { status: 503 }
    );
  }

  let body: { title?: unknown; body?: unknown; url?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine — fall back to defaults below.
  }

  const payload = {
    title: typeof body.title === 'string' && body.title ? body.title : 'Akra Admin',
    body: typeof body.body === 'string' && body.body ? body.body : 'Test notification from Akra Admin',
    url: typeof body.url === 'string' && body.url ? body.url : '/status',
  };

  const res = await sendToAll(payload);
  if (!res.ok) {
    return NextResponse.json({ error: res.error, hint: tableHint(res.error) }, { status: 500 });
  }
  return NextResponse.json(res);
}
