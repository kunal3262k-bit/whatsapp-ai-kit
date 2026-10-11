import { config } from './config';
import { env } from './env';
import { logger } from './logger';
import { initStore } from './store';
import { startReminders } from './reminders';
import { startWhatsApp, sendText } from './whatsapp';

async function main(): Promise<void> {
  logger.info(`🚀 WhatsApp AI Kit — client="${env.CLIENT}" business="${config.business.name}"`);
  logger.info(`   provider=${env.AI_PROVIDER} model=${env.AI_MODEL} storage=${env.STORAGE}`);

  await initStore();
  startReminders(sendText);
  await startWhatsApp();

  logger.info('Bot is running. Press Ctrl+C to stop.');
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`);
});

process.on('SIGINT', () => {
  logger.info('Shutting down (SIGINT)...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  logger.info('Shutting down (SIGTERM)...');
  process.exit(0);
});

main().catch((err) => {
  logger.error(`Fatal: ${(err as Error).message}`);
  process.exit(1);
});
