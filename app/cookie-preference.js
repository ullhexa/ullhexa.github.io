// Only the visitor's choice, disclosure version and dates are retained locally.
// No visitor identifier, backend consent profile or browsing history.
export const CONSENT_KEY = 'ullhexa-cookie-choice';
export const CONSENT_VERSION = '20261120-dialog';
export const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;
const stores = new WeakMap();

export function validChoice(raw, now = Date.now()) {
  try {
    const item = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return item && item.version === CONSENT_VERSION && typeof item.paypal === 'boolean' &&
      Number.isFinite(item.decidedAt) && item.decidedAt <= now &&
      item.expiresAt === item.decidedAt + CONSENT_LIFETIME && item.expiresAt > now ? item : null;
  } catch { return null; }
}

export function createCookiePreference(win, now = Date.now) {
  let memory = null;
  let memoryOnly = false;
  let expiryTimer;
  let last = null;
  const subscribers = new Set();
  const read = () => {
    if (memoryOnly) return validChoice(memory, now());
    try { return validChoice(win.localStorage.getItem(CONSENT_KEY), now()); }
    catch { return validChoice(memory, now()); }
  };
  const notify = () => {
    const choice = read();
    win.clearTimeout(expiryTimer);
    if (choice) expiryTimer = win.setTimeout(notify, Math.min(choice.expiresAt - now(), 2147483647));
    const fingerprint = JSON.stringify(choice);
    if (fingerprint === last) return choice;
    last = fingerprint;
    for (const fn of [...subscribers]) fn(choice);
    return choice;
  };
  const onStorage = event => { if (event.key === CONSENT_KEY || event.key === null) notify(); };
  win.addEventListener('storage', onStorage);
  win.addEventListener('pageshow', notify);
  win.addEventListener('focus', notify);
  const store = {
    read,
    refresh: notify,
    choose(paypal) {
      if (typeof paypal !== 'boolean') throw new TypeError('An explicit choice is required');
      const decidedAt = now();
      memory = { version:CONSENT_VERSION, paypal, decidedAt, expiresAt:decidedAt + CONSENT_LIFETIME };
      try { win.localStorage.setItem(CONSENT_KEY, JSON.stringify(memory)); memoryOnly = false; }
      catch { memoryOnly = true; }
      // If storage is readable but refuses writes, use the explicit choice in
      // this document only. Never assume an opt-in on another page.
      notify();
      return memory;
    },
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    destroy() {
      subscribers.clear();
      win.clearTimeout(expiryTimer);
      win.removeEventListener('storage', onStorage);
      win.removeEventListener('pageshow', notify);
      win.removeEventListener('focus', notify);
    }
  };
  notify();
  return store;
}

export function cookiePreference(doc) {
  if (!stores.has(doc)) stores.set(doc, createCookiePreference(doc.defaultView));
  return stores.get(doc);
}
