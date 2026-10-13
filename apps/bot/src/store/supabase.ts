import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Contact, LeadRow, MessageRecord, Reminder, Store } from '../types';

/**
 * Supabase-backed store (free tier). Run supabase/schema.sql once in the
 * Supabase SQL editor to create the tables.
 */
export class SupabaseStore implements Store {
  private sb: SupabaseClient;

  constructor(url: string, key: string) {
    this.sb = createClient(url, key, { auth: { persistSession: false } });
  }

  async init(): Promise<void> {
    const { error } = await this.sb.from('contacts').select('jid').limit(1);
    if (error) throw new Error(`Supabase not ready (run schema.sql): ${error.message}`);
  }

  async getContact(jid: string): Promise<Contact | null> {
    const { data, error } = await this.sb.from('contacts').select('*').eq('jid', jid).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      jid: data.jid,
      phone: data.phone,
      name: data.name ?? undefined,
      status: data.status,
      step: data.step,
      answers: data.answers ?? {},
      followupsSent: data.followups_sent ?? 0,
      lastInboundAt: data.last_inbound_at ?? undefined,
      handoffAt: data.handoff_at ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async upsertContact(c: Contact): Promise<void> {
    const { error } = await this.sb.from('contacts').upsert({
      jid: c.jid,
      phone: c.phone,
      name: c.name ?? null,
      status: c.status,
      step: c.step,
      answers: c.answers,
      followups_sent: c.followupsSent,
      last_inbound_at: c.lastInboundAt ?? null,
      handoff_at: c.handoffAt ?? null,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    });
    if (error) throw error;
  }

  async appendMessage(m: MessageRecord): Promise<void> {
    const { error } = await this.sb.from('messages').insert({ jid: m.jid, role: m.role, text: m.text, at: m.at });
    if (error) throw error;
  }

  async listMessages(jid: string, limit = 50): Promise<MessageRecord[]> {
    const { data, error } = await this.sb
      .from('messages')
      .select('jid,role,text,at')
      .eq('jid', jid)
      .order('at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).reverse() as MessageRecord[];
  }

  async addLead(l: LeadRow): Promise<void> {
    const { error } = await this.sb.from('leads').insert({
      jid: l.jid,
      name: l.name ?? null,
      phone: l.phone,
      fields: l.fields,
      qualified: l.qualified,
      status: l.qualified ? 'qualified' : 'disqualified',
      created_at: l.createdAt,
    });
    if (error) throw error;
  }

  async addReminder(r: Reminder): Promise<void> {
    const { error } = await this.sb.from('reminders').upsert({
      id: r.id,
      jid: r.jid,
      kind: r.kind,
      run_at: r.runAt,
      message: r.message,
      done: r.done,
      created_at: r.createdAt,
    });
    if (error) throw error;
  }

  async dueReminders(nowIso: string): Promise<Reminder[]> {
    const { data, error } = await this.sb
      .from('reminders')
      .select('*')
      .eq('done', false)
      .lte('run_at', nowIso);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      jid: r.jid,
      kind: r.kind,
      runAt: r.run_at,
      message: r.message,
      done: r.done,
      createdAt: r.created_at,
    }));
  }

  async markReminderDone(id: string): Promise<void> {
    const { error } = await this.sb.from('reminders').update({ done: true }).eq('id', id);
    if (error) throw error;
  }
}
