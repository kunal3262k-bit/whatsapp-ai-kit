import { env } from '../env';
import { logger } from '../logger';
import type { Store } from '../types';
import { LocalStore } from './local';
import { SupabaseStore } from './supabase';

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  if (env.STORAGE === 'supabase') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error('STORAGE=supabase but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing. Falling back to local.');
      store = new LocalStore();
    } else {
      store = new SupabaseStore(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    }
  } else {
    store = new LocalStore();
  }
  return store;
}

export async function initStore(): Promise<Store> {
  const s = getStore();
  await s.init();
  logger.info(`✅ Storage ready: ${env.STORAGE}`);
  return s;
}
