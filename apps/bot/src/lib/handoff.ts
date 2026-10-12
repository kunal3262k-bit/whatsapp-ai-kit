/**
 * A contact was handed to a human and the bot went quiet. After the client
 * stays idle for `idleHours`, the bot may resume the automated flow.
 * "Strictly past" the window: exactly at the threshold does not resume.
 */
export function shouldResume(
  c: { status: string; handoffAt?: string },
  nowMs: number,
  idleHours: number
): boolean {
  return c.status === 'human' && !!c.handoffAt && nowMs - Date.parse(c.handoffAt) > idleHours * 3600_000;
}
