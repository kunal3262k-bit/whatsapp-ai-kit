import cron from 'node-cron';
import { config, baseVars, fill } from './config';
import { env } from './env';
import { logger } from './logger';
import { getStore } from './store';
import type { Reminder } from './types';
import { randomUUID } from 'crypto';

export interface SendFn {
  (jid: string, text: string): Promise<void>;
}

/** Create a follow-up reminder `hours` from now. No-op if message is empty. */
export async function scheduleFollowup(jid: string, name: string | undefined, hours: number): Promise<void> {
  const message = fill(config.reminders.followup_message, baseVars({ name: name ?? '' })).trim();
  if (!message) return;
  const runAt = new Date(Date.now() + hours * 3600_000).toISOString();
  const reminder: Reminder = {
    id: randomUUID(),
    jid,
    kind: 'followup',
    runAt,
    message,
    done: false,
    createdAt: new Date().toISOString(),
  };
  await getStore().addReminder(reminder);
  logger.info(`⏰ Scheduled follow-up for ${jid} at ${runAt}`);
}

/** Poll reminders once (exported for a manual "tick" / testing). */
export async function runDueReminders(send: SendFn): Promise<number> {
  const due = await getStore().dueReminders(new Date().toISOString());
  for (const r of due) {
    try {
      await send(r.jid, r.message);
      await getStore().markReminderDone(r.id);
      logger.info(`⏰ Reminder sent (${r.kind}) to ${r.jid}`);
    } catch (err) {
      logger.warn(`Reminder send failed for ${r.jid}: ${(err as Error).message}`);
    }
  }
  return due.length;
}

export function startReminders(send: SendFn): void {
  if (!config.reminders.enabled) {
    logger.info('⏰ Reminders disabled in config');
    return;
  }
  cron.schedule(
    '* * * * *',
    () => {
      void runDueReminders(send);
    },
    { timezone: env.TZ }
  );
  logger.info('⏰ Reminder scheduler started (checks every minute)');
}
