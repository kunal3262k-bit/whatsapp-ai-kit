export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified' | 'human';

export const LEAD_STATUSES: readonly LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'disqualified',
  'human',
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  disqualified: 'Disqualified',
  human: 'Human',
};

/** Shape returned by the `leads` table (raw columns). */
export interface RawLead {
  id: number;
  name: string | null;
  phone: string;
  fields: Record<string, unknown> | null;
  qualified: boolean;
  status?: string | null;
  created_at: string;
}

/** Enriched, display-ready lead for the CRM. */
export interface LeadView extends RawLead {
  status: LeadStatus;
  business: string | null;
  need: string | null;
  callTime: string | null;
  wa: string | null;
  extras: { key: string; value: string }[];
}

const BUSINESS_KEYS = ['business', 'company', 'business_name'];
const NEED_KEYS = ['need', 'service', 'requirement', 'interested_in', 'purpose'];
const TIME_KEYS = [
  'call_time',
  'calltime',
  'when',
  'timeline',
  'preferred_time',
  'preferred_call_time',
  'slot',
];

const CONSUMED = new Set<string>(['name', ...BUSINESS_KEYS, ...NEED_KEYS, ...TIME_KEYS]);

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}

/** Resolve a display status, tolerating rows created before the column existed. */
export function statusOf(lead: Pick<RawLead, 'status' | 'qualified'>): LeadStatus {
  if (isLeadStatus(lead.status)) return lead.status;
  return lead.qualified ? 'qualified' : 'new';
}

/** Digits only — wa.me requires an international number without punctuation. */
export function digitsOnly(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '');
}

export function waLink(phone: string | null | undefined, text?: string): string | null {
  const d = digitsOnly(phone);
  if (!d) return null;
  const base = `https://wa.me/${d}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function firstField(fields: Record<string, unknown> | null, keys: string[]): string | null {
  if (!fields) return null;
  for (const key of keys) {
    const value = fields[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

export function toLeadView(lead: RawLead, waText = 'Hi! Thanks for your enquiry.'): LeadView {
  const fields = lead.fields ?? {};
  const extras = Object.entries(fields)
    .filter(([key, value]) => !CONSUMED.has(key) && value !== undefined && value !== null && String(value).trim())
    .map(([key, value]) => ({ key, value: String(value) }));

  return {
    ...lead,
    fields,
    status: statusOf(lead),
    business: firstField(fields, BUSINESS_KEYS),
    need: firstField(fields, NEED_KEYS),
    callTime: firstField(fields, TIME_KEYS),
    wa: waLink(lead.phone, waText),
    extras,
  };
}

export function toCsv(leads: LeadView[]): string {
  const header = ['Created At', 'Name', 'Phone', 'Business', 'Need', 'Call Time', 'Status'];
  const escape = (value: string | null) => {
    const text = value ?? '';
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = leads.map((lead) =>
    [lead.created_at, lead.name, lead.phone, lead.business, lead.need, lead.callTime, lead.status]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
