import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { env } from './env';
import { logger } from './logger';

const FieldSchema = z.object({
  key: z.string(),
  question: z.string(),
  type: z.enum(['text', 'choice']).default('text'),
  options: z.array(z.string()).optional(),
});

const ConfigSchema = z.object({
  business: z.object({
    name: z.string(),
    type: z.string().default('generic'),
    about: z.string().default(''),
    location: z.string().default(''),
    hours: z.string().default(''),
    phone: z.string().default(''),
    website: z.string().default(''),
  }),
  persona: z.object({
    name: z.string().default('Assistant'),
    role: z.string().default('assistant'),
    tone: z.string().default('warm, concise, human'),
    language: z.string().default('auto'),
  }),
  greeting: z.string(),
  qualification: z.object({
    intro: z.string().default(''),
    fields: z.array(FieldSchema).min(1),
  }),
  qualify_rule: z
    .object({
      min_answers: z.number().int().default(1),
      disqualify_if: z.array(z.string()).default([]),
    })
    .default({}),
  post_qualify_message: z.string().default(''),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  handoff: z
    .object({
      human_name: z.string().default('Owner'),
      human_phone: z.string().default(''),
      notify: z.boolean().default(true),
    })
    .default({}),
  reminders: z
    .object({
      enabled: z.boolean().default(true),
      followup_after_hours: z.number().default(24),
      followup_message: z.string().default(''),
      max_followups: z.number().int().default(1),
    })
    .default({}),
  guardrails: z
    .object({
      max_messages_per_minute: z.number().int().default(15),
      min_gap_ms: z.number().int().default(1500),
      opt_out_words: z.array(z.string()).default(['stop']),
      never_say: z.array(z.string()).default([]),
    })
    .default({}),
});

export type ClientConfig = z.infer<typeof ConfigSchema>;

function configPath(): string {
  const root = path.resolve(__dirname, '../../../config');
  const candidate = path.join(root, `${env.CLIENT}.json`);
  if (fs.existsSync(candidate)) return candidate;
  const fallback = path.join(root, 'client.example.json');
  logger.warn(`config/${env.CLIENT}.json not found — falling back to client.example.json`);
  return fallback;
}

function loadConfig(): ClientConfig {
  const file = configPath();
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const parsed = ConfigSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('❌ Invalid client config:', JSON.stringify(parsed.error.flatten(), null, 2));
    process.exit(1);
  }
  logger.info(`Loaded client config: ${path.basename(file)} (${parsed.data.business.name})`);
  return parsed.data;
}

export const config = loadConfig();

export function baseVars(extra: Record<string, string> = {}): Record<string, string> {
  return {
    business_name: config.business.name,
    business_location: config.business.location,
    business_hours: config.business.hours,
    persona_name: config.persona.name,
    ...extra,
  };
}

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) =>
    key in vars ? vars[key]! : ''
  );
}
