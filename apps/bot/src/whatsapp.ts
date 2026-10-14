import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type proto,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { config } from './config';
import { env } from './env';
import { handleIncoming } from './flow';
import { logger } from './logger';
import { getLimiter } from './lib/ratelimit';

const silent = pino({ level: 'silent' });
const allowedCodes = env.ALLOWED_COUNTRY_CODES.split(',').map((c) => c.trim()).filter(Boolean);

let sock: WASocket | null = null;
let reconnecting = false;

function phoneToJid(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `${digits}@s.whatsapp.net`;
}

function extractText(m: proto.IMessage | null | undefined): string {
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedId ||
    ''
  );
}

export type SkipReason =
  | 'not-live'
  | 'no-message'
  | 'from-me'
  | 'no-jid'
  | 'status-broadcast'
  | 'group'
  | 'not-a-chat'
  | 'country-not-allowed'
  | 'empty-text';

export interface IncomingDecision {
  chatJid: string;
  /** Best-known phone digits (from the PN JID). Empty when only a LID is available. */
  phone: string;
  text: string;
  skip?: SkipReason;
}

/**
 * Decide whether an incoming upsert message should be handled.
 *
 * WhatsApp now routes most chats via LID (`<id>@lid`) instead of phone-number
 * JIDs (`<phone>@s.whatsapp.net`). We accept both: reply to the stable chat JID,
 * but resolve the real phone from `senderPn`/`participantPn` for allowlist checks.
 */
export function decideIncoming(
  key: {
    type: string;
    fromMe: boolean;
    remoteJid?: string | null;
    senderPn?: string | null;
    participantPn?: string | null;
    message?: proto.IMessage | null;
  },
  opts: { allowedCodes: string[]; ignoreGroups: boolean }
): IncomingDecision {
  const chatJid = key.remoteJid ?? '';
  const text = extractText(key.message);
  const base: IncomingDecision = { chatJid, phone: '', text };

  if (key.type !== 'notify') return { ...base, skip: 'not-live' };
  if (!key.message) return { ...base, skip: 'no-message' };
  if (key.fromMe) return { ...base, skip: 'from-me' };
  if (!chatJid) return { ...base, skip: 'no-jid' };
  if (chatJid === 'status@broadcast') return { ...base, skip: 'status-broadcast' };
  if (opts.ignoreGroups && chatJid.endsWith('@g.us')) return { ...base, skip: 'group' };

  const isPn = chatJid.endsWith('@s.whatsapp.net');
  const isLid = chatJid.endsWith('@lid');
  if (!isPn && !isLid) return { ...base, skip: 'not-a-chat' };

  const pnJid = (key.senderPn || key.participantPn || '').trim();
  const phone = (isPn ? chatJid : pnJid).split('@')[0] ?? '';
  const decision: IncomingDecision = { chatJid, phone, text };

  if (phone && opts.allowedCodes.length && !opts.allowedCodes.some((cc) => phone.startsWith(cc))) {
    return { ...decision, skip: 'country-not-allowed' };
  }
  if (!text) return { ...decision, skip: 'empty-text' };
  return decision;
}

function chunk(text: string, size = 4000): string[] {
  if (text.length <= size) return [text];
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

export async function sendText(jid: string, text: string): Promise<void> {
  if (!sock) throw new Error('WhatsApp socket not ready');
  await getLimiter().waitTurn();
  for (const part of chunk(text)) {
    await sock.sendMessage(jid, { text: part });
  }
}

async function notifyOwner(text: string): Promise<void> {
  const phone = config.handoff.human_phone;
  if (!phone) {
    logger.info(`[owner-notify] ${text.replace(/\n/g, ' | ')}`);
    return;
  }
  try {
    await sendText(phoneToJid(phone), text);
  } catch (err) {
    logger.warn(`Owner notify failed: ${(err as Error).message}`);
  }
}

export function getSocket(): WASocket | null {
  return sock;
}

export async function startWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(env.AUTH_DIR);
  let version: [number, number, number] | undefined;
  try {
    version = (await fetchLatestBaileysVersion()).version;
  } catch {
    logger.warn('Could not fetch latest WA version — using library default');
  }

  sock = makeWASocket({
    auth: state,
    ...(version ? { version } : {}),
    logger: silent,
    printQRInTerminal: false,
    browser: ['WhatsApp AI Kit', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('📲 Scan this QR with the client WhatsApp (Linked devices):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      logger.info(`✅ WhatsApp connected as ${sock?.user?.id ?? 'unknown'}`);
      reconnecting = false;
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      if (loggedOut) {
        logger.error('❌ Logged out. Delete AUTH_DIR and restart to scan a new QR.');
        return;
      }
      if (reconnecting) return;
      reconnecting = true;
      const delay = 5000;
      logger.warn(`🔌 Connection closed (code ${statusCode ?? '?'}). Reconnecting in ${delay / 1000}s...`);
      setTimeout(() => {
        reconnecting = false;
        startWhatsApp().catch((e) => logger.error(`Reconnect failed: ${(e as Error).message}`));
      }, delay);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      try {
        const d = decideIncoming(
          {
            type,
            fromMe: !!msg.key.fromMe,
            remoteJid: msg.key.remoteJid,
            senderPn: msg.key.senderPn,
            participantPn: msg.key.participantPn,
            message: msg.message,
          },
          { allowedCodes, ignoreGroups: env.IGNORE_GROUPS === 'true' }
        );
        logger.info(
          `📥 upsert type=${type} jid=${d.chatJid || '—'} phone=${d.phone || '—'} skip=${d.skip ?? 'none'} text=${JSON.stringify(d.text.slice(0, 60))}`
        );
        if (d.skip) continue;

        await handleIncoming(d.chatJid, d.phone, d.text, { sendText, notifyOwner }, msg.pushName ?? undefined);
      } catch (err) {
        logger.error(`Message handling failed: ${(err as Error).message}`);
      }
    }
  });
}
