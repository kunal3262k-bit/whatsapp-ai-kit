import { NextResponse } from 'next/server';
import { getServiceClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

/** Save a browser PushSubscription for the owner's device. */
export async function POST(request: Request): Promise<Response> {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { ok: false, error: 'endpoint, keys.p256dh and keys.auth are required' },
      { status: 400 }
    );
  }

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'storage not configured' }, { status: 503 });
  }

  const { error } = await sb.from('push_subscriptions').upsert(
    { endpoint, p256dh, auth, enabled: true, last_seen_at: new Date().toISOString() },
    { onConflict: 'endpoint' }
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** Remove a subscription (e.g. user disabled notifications). */
export async function DELETE(request: Request): Promise<Response> {
  const endpoint = new URL(request.url).searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: 'endpoint is required' }, { status: 400 });
  }

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'storage not configured' }, { status: 503 });
  }

  const { error } = await sb.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
