import fs from 'fs';
import path from 'path';
import type { Contact, LeadRow, MessageRecord, Reminder, Store } from '../types';

interface DbShape {
  contacts: Record<string, Contact>;
  messages: MessageRecord[];
  leads: LeadRow[];
  reminders: Reminder[];
}

const EMPTY: DbShape = { contacts: {}, messages: [], leads: [], reminders: [] };

/**
 * Zero-dependency JSON store. Good for a single client on one machine.
 * Writes are serialized to avoid corruption; file replace is atomic.
 */
export class LocalStore implements Store {
  private file: string;
  private db: DbShape = structuredClone(EMPTY);
  private writeChain: Promise<void> = Promise.resolve();

  constructor() {
    const dir = path.resolve(__dirname, '../../../../data');
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, 'store.json');
  }

  async init(): Promise<void> {
    if (fs.existsSync(this.file)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<DbShape>;
        this.db = {
          contacts: parsed.contacts ?? {},
          messages: parsed.messages ?? [],
          leads: parsed.leads ?? [],
          reminders: parsed.reminders ?? [],
        };
      } catch {
        this.db = structuredClone(EMPTY);
      }
    }
  }

  private persist(): Promise<void> {
    this.writeChain = this.writeChain.then(async () => {
      const tmp = `${this.file}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(this.db, null, 2));
      await fs.promises.rename(tmp, this.file);
    });
    return this.writeChain;
  }

  async getContact(jid: string): Promise<Contact | null> {
    return this.db.contacts[jid] ?? null;
  }

  async upsertContact(c: Contact): Promise<void> {
    this.db.contacts[c.jid] = c;
    await this.persist();
  }

  async appendMessage(m: MessageRecord): Promise<void> {
    this.db.messages.push(m);
    if (this.db.messages.length > 20000) this.db.messages.splice(0, this.db.messages.length - 20000);
    await this.persist();
  }

  async listMessages(jid: string, limit = 50): Promise<MessageRecord[]> {
    return this.db.messages.filter((m) => m.jid === jid).slice(-limit);
  }

  async addLead(l: LeadRow): Promise<void> {
    this.db.leads.push(l);
    await this.persist();
  }

  async addReminder(r: Reminder): Promise<void> {
    this.db.reminders.push(r);
    await this.persist();
  }

  async dueReminders(nowIso: string): Promise<Reminder[]> {
    return this.db.reminders.filter((r) => !r.done && r.runAt <= nowIso);
  }

  async markReminderDone(id: string): Promise<void> {
    const r = this.db.reminders.find((x) => x.id === id);
    if (r) r.done = true;
    await this.persist();
  }
}
