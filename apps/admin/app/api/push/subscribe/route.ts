import { NextResponse } from 'next/server';
import { listSubscriptions, pushEnv, removeSubscription, saveSubscription, tableHint } from '../../../../lib/push';
import { isPushSubscriptionLike } from '../../../../lib/push-shared';
import { requireAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });

  const { configured } = pushEnv();
  const res = await listSubscriptions();
  if (!res.ok) {
    return NextResponse.json({ configured, error: res.error, hint: tableHint(res.error) }, { status: 500 });
  }
  return NextResponse.json({ configured, subscriptions: res.subscriptions });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!isPushSubscriptionLike(body)) {
    return NextResponse.json({ error: 'A valid web-push subscription is required' }, { status: 400 });
  }

  const res = await saveSubscription({
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
  });
  if (!res.ok) {
    return NextResponse.json({ error: res.error, hint: tableHint(res.error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, subscription: res.subscription });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });

  let body: { endpoint?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body.endpoint !== 'string' || !body.endpoint) {
    return NextResponse.json({ error: 'An endpoint string is required' }, { status: 400 });
  }

  const res = await removeSubscription(body.endpoint);
  if (!res.ok) {
    return NextResponse.json({ error: res.error, hint: tableHint(res.error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
