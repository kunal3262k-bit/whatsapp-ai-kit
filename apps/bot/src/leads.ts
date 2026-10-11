import { env } from './env';
import { logger } from './logger';
import type { LeadRow } from './types';

/**
 * Push a qualified lead to a Google Sheet via an Apps Script Web App.
 * Fire-and-forget: never throws, never blocks the conversation.
 * See docs/apps-script/Code.gs for the receiving script.
 */
export async function pushLeadToSheet(lead: LeadRow): Promise<void> {
  const url = env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.GOOGLE_SHEET_SECRET, lead }),
    });
    if (!res.ok) logger.warn(`Sheet push HTTP ${res.status}`);
    else logger.info(`📊 Lead pushed to Google Sheet: ${lead.phone}`);
  } catch (err) {
    logger.warn(`Sheet push failed: ${(err as Error).message}`);
  }
}
