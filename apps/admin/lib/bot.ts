import { getServiceClient } from './supabase';
import { mostRecent } from './bot-shared';

export interface BotCounts {
  leads: number;
  qualified: number;
  messages: number;
  contacts: number;
  remindersOpen: number;
}

export interface BotActivity {
  ok: boolean;
  error?: string;
  lastActivityAt: string | null;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  lastLeadAt: string | null;
  counts: BotCounts;
  config: { key: string; value: string }[];
}

const EMPTY_COUNTS: BotCounts = { leads: 0, qualified: 0, messages: 0, contacts: 0, remindersOpen: 0 };

/** Optional runtime config to surface on the status page (secrets shown as booleans only). */
function runtimeConfig(): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  const push = (key: string, value?: string) => {
    if (value) out.push({ key, value });
  };
  push('AI model', process.env.AI_MODEL);
  push('Storage', process.env.STORAGE);
  push('Client', process.env.CLIENT);
  if (process.env.AI_API_KEY) out.push({ key: 'AI key', value: 'configured' });
  return out;
}

/** Derive the bot's health/last-activity from the Supabase tables it writes to (no heartbeat table). */
export async function getBotActivity(): Promise<BotActivity> {
  const base: BotActivity = {
    ok: false,
    lastActivityAt: null,
    lastMessageAt: null,
    lastInboundAt: null,
    lastLeadAt: null,
    counts: EMPTY_COUNTS,
    config: runtimeConfig(),
  };

  const sb = getServiceClient();
  if (!sb) {
    return { ...base, error: 'Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' };
  }

  const [msg, inbound, lead, leads, qualified, messages, contacts, reminders] = await Promise.all([
    sb.from('messages').select('at').not('at', 'is', null).order('at', { ascending: false }).limit(1),
    sb
      .from('contacts')
      .select('last_inbound_at')
      .not('last_inbound_at', 'is', null)
      .order('last_inbound_at', { ascending: false })
      .limit(1),
    sb.from('leads').select('created_at').order('created_at', { ascending: false }).limit(1),
    sb.from('leads').select('*', { count: 'exact', head: true }),
    sb.from('leads').select('*', { count: 'exact', head: true }).eq('qualified', true),
    sb.from('messages').select('*', { count: 'exact', head: true }),
    sb.from('contacts').select('*', { count: 'exact', head: true }),
    sb.from('reminders').select('*', { count: 'exact', head: true }).eq('done', false),
  ]);

  const firstError = [msg, inbound, lead, leads, qualified, messages, contacts, reminders].find(
    (r) => r.error
  )?.error;
  if (firstError) return { ...base, error: firstError.message };

  const lastMessageAt = (msg.data?.[0]?.at as string | undefined) ?? null;
  const lastInboundAt = (inbound.data?.[0]?.last_inbound_at as string | undefined) ?? null;
  const lastLeadAt = (lead.data?.[0]?.created_at as string | undefined) ?? null;

  return {
    ok: true,
    lastMessageAt,
    lastInboundAt,
    lastLeadAt,
    lastActivityAt: mostRecent([lastMessageAt, lastInboundAt, lastLeadAt]),
    counts: {
      leads: leads.count ?? 0,
      qualified: qualified.count ?? 0,
      messages: messages.count ?? 0,
      contacts: contacts.count ?? 0,
      remindersOpen: reminders.count ?? 0,
    },
    config: runtimeConfig(),
  };
}
