import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from the repo root regardless of where the process was launched.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const EnvSchema = z.object({
  AUTH_DIR: z.string().default('./auth_state'),
  STORAGE: z.enum(['local', 'supabase']).default('local'),
  ALLOWED_COUNTRY_CODES: z.string().default('91'),
  IGNORE_GROUPS: z.string().default('true'),

  AI_PROVIDER: z.string().default('groq'),
  AI_API_KEY: z.string().default(''),
  AI_BASE_URL: z.string().default('https://api.groq.com/openai/v1'),
  AI_MODEL: z.string().default('llama-3.3-70b-versatile'),

  SUPABASE_URL: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),

  GOOGLE_SHEET_WEBHOOK_URL: z.string().default(''),
  GOOGLE_SHEET_SECRET: z.string().default('change-me'),

  CLIENT: z.string().default('client'),
  TZ: z.string().default('Asia/Kolkata'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
