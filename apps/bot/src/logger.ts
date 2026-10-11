import pino from 'pino';

const level = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level,
  transport: {
    target: 'pino/file',
    options: { destination: 1 },
  },
  base: undefined,
});

export type Logger = typeof logger;
