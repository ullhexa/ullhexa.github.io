import {cookiePreference} from './cookie-preference.js?v=20261122-analytics2';
import {EXCLUSION_KEY, PROJECT_TOKEN, pageContext, campaignContext, allowedProperties, filterEvent, sdkConfig} from './analytics-policy.js?v=20261124-audio-extras';
import {loadPostHog} from './posthog-loader.js?v=20261124-audio-extras';

const mounts = new WeakMap();
export function clearAnalyticsStorage(win) {
  for (const name of ['localStorage','sessionStorage']) {
    try {
      const storage = win[name];
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key && (key.startsWith('ph_ullhexa_analytics') || key.startsWith(`ph_${PROJECT_TOKEN}`) || key === `__ph_opt_in_out_${PROJECT_TOKEN}`)) storage.removeItem(key);
      }
    } catch { /* Other application storage is never cleared. */ }
  }
}

export function createAnalytics(doc, preference, loader = loadPostHog) {
  const win = doc.defaultView;
  let sdk = null, loading = null, generation = 0, enabled = false, destroyed = false;
  let queue = [], view = null, visibleAt = null, visibleSeconds = 0, totalVisible = 0;
  let timer = null;
  const uuid = () => win.crypto.randomUUID();
  const production = ['ullhexa.com','www.ullhexa.com'].includes(win.location.hostname) && win.location.protocol === 'https:' && win.self === win.top && typeof win.crypto?.randomUUID === 'function';
  const entryCampaign = campaignContext(win.location.href, doc.referrer);
  const excluded = () => {
    try { return win.localStorage.getItem(EXCLUSION_KEY) === 'true'; } catch { return false; }
  };
  // An owner can exclude this browser on the live site with ?analytics=off.
  // ?analytics=on removes the exclusion; it never overrides consent.
  try {
    const flag = new URL(win.location.href).searchParams.get('analytics');
    if (flag === 'off') win.localStorage.setItem(EXCLUSION_KEY,'true');
    if (flag === 'on') win.localStorage.removeItem(EXCLUSION_KEY);
  } catch { /* Storage may be unavailable. */ }
  const listeners = new Set();
  const allowed = () => !destroyed && production && !!pageContext(win.location.href) && !excluded() && preference.read()?.analytics === true;
  const send = (event, props, instant = false) => {
    if (!allowed()) return false;
    const context = pageContext(win.location.href);
    if (!context) return false;
    const payload = {...context,...entryCampaign,...allowedProperties(props)};
    if (props?.$current_url) Object.assign(payload,pageContext(props.$current_url));
    if (props?.$pageview_id) payload.$pageview_id = props.$pageview_id;
    if (props?.$prev_pageview_id) payload.$prev_pageview_id = props.$prev_pageview_id;
    if (!filterEvent({event,properties:payload},true)) return false;
    if (sdk) { try { sdk.capture(event,payload,instant ? {transport:'sendBeacon',send_instantly:true} : undefined); } catch { return false; } }
    else if (queue.length < 40) queue.push({event,payload,instant});
    return true;
  };
  const accumulate = () => {
    if (visibleAt !== null) {
      const seconds = Math.max(0,(win.performance.now()-visibleAt)/1000);
      visibleSeconds += seconds; totalVisible += seconds;
    }
    visibleAt = enabled && doc.visibilityState === 'visible' ? win.performance.now() : null;
  };
  const flushVisible = () => {
    if (!view || !enabled) return;
    accumulate();
    if (visibleSeconds >= 1) send('page_visible',{...view,visible_seconds:visibleSeconds},true);
    visibleSeconds = 0;
  };
  const leave = () => {
    if (!view) return;
    flushVisible();
    send('$pageleave',{...view,$prev_pageview_id:view.view_id,$prev_pageview_duration:totalVisible},true);
    view = null; visibleAt = null; visibleSeconds = totalVisible = 0;
  };
  const page = () => {
    if (!enabled || !allowed()) return;
    const next = pageContext(win.location.href);
    if (!next || next.$current_url === view?.$current_url) return;
    leave();
    view = {...next,view_id:uuid()};
    visibleAt = doc.visibilityState === 'visible' ? win.performance.now() : null;
    send('$pageview',{...view,$pageview_id:view.view_id});
  };
  const apply = () => {
    const permit = allowed();
    if (permit === enabled) { if (!permit) clearAnalyticsStorage(win); return; }
    enabled = permit;
    const current = ++generation;
    queue = []; view = null; visibleAt = null; visibleSeconds = totalVisible = 0;
    win.clearInterval(timer);
    if (!permit) {
      sdk?.opt_out_capturing();
      clearAnalyticsStorage(win);
      for (const fn of listeners) fn(false);
      return;
    }
    timer = win.setInterval(flushVisible,60000);
    if (sdk) {
      // Clear the SDK opt-out marker without generating an opt-in event.
      sdk.clear_opt_in_out_capturing({enable_persistence:true});
      sdk.set_config({disable_persistence:false});
      sdk.reset(true);
    } else {
      loading ||= loader(doc,sdkConfig(event => filterEvent(event,allowed())));
      loading.then(client => {
        sdk = client;
        if (!allowed()) {sdk.opt_out_capturing(); clearAnalyticsStorage(win); return;}
        if (current !== generation) return;
        const pending = queue; queue = [];
        for (const item of pending) {
          if (!allowed()) break;
          sdk.capture(item.event,item.payload,item.instant ? {transport:'sendBeacon',send_instantly:true} : undefined);
        }
      }).catch(() => {queue=[]; loading=null;});
    }
    page();
    for (const fn of listeners) fn(true);
  };
  const click = event => {
    const target = event.target.closest?.('a');
    if (!target) return;
    if (target.matches('.pluginDownload')) send('installer_download_clicked',{version:target.dataset.version},true);
    else if (target.matches('.pluginCheckoutLink')) send('plugin_download_page_opened',{},true);
    else if (new URL(target.href,win.location.href).pathname === '/dnd/') send('gm_console_play_clicked',{},true);
  };
  const visibility = () => { flushVisible(); };
  const restore = () => { apply(); page(); };
  const storage = e => {if (e.key === EXCLUSION_KEY || e.key === null) apply();};
  doc.addEventListener('click',click);
  doc.addEventListener('visibilitychange',visibility);
  win.addEventListener('hashchange',page);
  win.addEventListener('popstate',page);
  win.addEventListener('pagehide',leave);
  win.addEventListener('pageshow',restore);
  win.addEventListener('storage',storage);
  const unsubscribe = preference.subscribe(apply);
  apply();
  return {
    capture:send, isEnabled:allowed,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    destroy() {
      destroyed=true; enabled=false; ++generation; queue=[]; unsubscribe(); win.clearInterval(timer);
      doc.removeEventListener('click',click); doc.removeEventListener('visibilitychange',visibility);
      win.removeEventListener('hashchange',page); win.removeEventListener('popstate',page);
      win.removeEventListener('pagehide',leave); win.removeEventListener('pageshow',restore); win.removeEventListener('storage',storage);
      sdk?.opt_out_capturing();
    }
  };
}

export function analyticsFor(doc) {
  if (!mounts.has(doc)) mounts.set(doc,createAnalytics(doc,cookiePreference(doc)));
  return mounts.get(doc);
}
