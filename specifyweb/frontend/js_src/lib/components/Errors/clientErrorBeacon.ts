/**
 * Fire-and-forget beacon that tells the server a client-side error dialog was shown.
 *
 * The server only logs one line per report (see backend/context/views.py client_error), so
 * an institution can count UI crashes per collection from server logs instead of waiting for a
 * user to email a downloaded crash report. Nothing here can ever throw or open another dialog:
 * failures are swallowed, the same message is sent at most once a minute, and payloads are capped.
 *
 * @module
 */

import { ping } from '../../utils/ajax/ping';

const lastSent = new Map<string, number>();
const dedupeWindowMs = 60_000;
const maxMessage = 2000;
const maxStack = 4000;

export function reportClientError(message: string, stack = ''): void {
  try {
    const key = message.slice(0, 200);
    const now = Date.now();
    if ((lastSent.get(key) ?? 0) > now - dedupeWindowMs) return;
    lastSent.set(key, now);
    void ping('/context/client_error/', {
      method: 'POST',
      errorMode: 'silent',
      body: {
        message: message.slice(0, maxMessage),
        stack: stack.slice(0, maxStack),
        url: globalThis.location?.href.slice(0, 500) ?? '',
      },
    }).catch(() => undefined);
  } catch {
    // The beacon must never become an error itself
  }
}
