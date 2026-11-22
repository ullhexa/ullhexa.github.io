import {PROJECT_TOKEN, API_HOST} from './analytics-policy.js?v=20261122-analytics';

// The official asynchronous snippet's bootstrap, invoked only after consent.
// The SDK owns browser/session IDs; our before_send allowlist owns event data.
export function loadPostHog(doc, config) {
  return new Promise((resolve, reject) => {
    const win = doc.defaultView;
    if (win.posthog?.__loaded) { win.posthog.set_config(config); resolve(win.posthog); return; }
    const stub = win.posthog = [];
    stub._i = [[PROJECT_TOKEN, {...config, loaded: sdk => {win.clearTimeout(timer); resolve(sdk);}}, undefined]];
    stub.__SV = 1;
    const script = doc.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.src = API_HOST.replace('.i.posthog.com','-assets.i.posthog.com') + '/static/array.js';
    const fail = () => {win.clearTimeout(timer); reject(new Error('Analytics unavailable'));};
    const timer = win.setTimeout(fail, 15000);
    script.onerror = fail;
    doc.head.append(script);
  });
}
