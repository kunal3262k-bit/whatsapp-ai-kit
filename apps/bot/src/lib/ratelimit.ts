import { config } from '../config';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ensures outgoing messages are spaced out (min gap + random jitter) and never
 * exceed the configured per-minute cap. Prevents WhatsApp spam-flagging.
 */
export class RateLimiter {
  private lastSend = 0;
  private window: number[] = [];

  constructor(private minGapMs: number, private perMinute: number) {}

  async waitTurn(): Promise<void> {
    // per-minute cap
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const now = Date.now();
      this.window = this.window.filter((t) => now - t < 60_000);
      if (this.window.length < this.perMinute) break;
      const oldest = this.window[0]!;
      await sleep(60_000 - (now - oldest) + 100);
    }

    // min gap + jitter
    const since = Date.now() - this.lastSend;
    if (since < this.minGapMs) {
      const jitter = Math.floor(Math.random() * 600);
      await sleep(this.minGapMs - since + jitter);
    }
    this.lastSend = Date.now();
    this.window.push(this.lastSend);
  }
}

let limiter: RateLimiter | null = null;
export function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(
      config.guardrails.min_gap_ms,
      config.guardrails.max_messages_per_minute
    );
  }
  return limiter;
}
