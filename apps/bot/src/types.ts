export type ContactStatus =
  | 'new'
  | 'qualifying'
  | 'qualified'
  | 'disqualified'
  | 'opted_out'
  | 'human';

export interface Contact {
  jid: string;
  phone: string;
  name?: string;
  status: ContactStatus;
  step: number;
  answers: Record<string, string>;
  followupsSent: number;
  lastInboundAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  jid: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
}

export interface Reminder {
  id: string;
  jid: string;
  kind: string;
  runAt: string;
  message: string;
  done: boolean;
  createdAt: string;
}

export interface LeadRow {
  jid: string;
  name?: string;
  phone: string;
  fields: Record<string, string>;
  qualified: boolean;
  createdAt: string;
}

export interface Store {
  init(): Promise<void>;
  getContact(jid: string): Promise<Contact | null>;
  upsertContact(c: Contact): Promise<void>;
  appendMessage(m: MessageRecord): Promise<void>;
  listMessages(jid: string, limit?: number): Promise<MessageRecord[]>;
  addLead(l: LeadRow): Promise<void>;
  addReminder(r: Reminder): Promise<void>;
  dueReminders(nowIso: string): Promise<Reminder[]>;
  markReminderDone(id: string): Promise<void>;
}
