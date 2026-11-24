// Only these public routes and deliberately defined actions may reach analytics.
export const PROJECT_TOKEN = 'phc_zepspA8VWXTrRpo2Nde9XQditpmYYiftn3EMnzKjEUP7';
export const API_HOST = 'https://eu.i.posthog.com';
export const EXCLUSION_KEY = 'ullhexa-analytics-excluded';
export const PLUGINS = ['daw-txt', 'headaxis', 'iiiipole', 'micronudge'];
export const SCENES = {
  midi: {plane:'plane', plasma:'plasma', rubik:'cube', cube:'cube', squares:'city'},
  audio: {'stereo-osc':'quantum-string', fractals:'alien-trees', cat:'space-cat'}
};
const sections = ['home','music','plugins','visualizers','dnd','about','contact','tools','skins','web','extras'];
const inputs = ['none','mic','shared_tab','midi','keyboard','touch'];
const actions = new Set(['$pageview','$pageleave','page_visible','plugin_download_page_opened',
  'installer_download_clicked','gm_console_play_clicked','visualizer_opened',
  'visualizer_input_attempted','visualizer_input_ready','visualizer_input_started',
  'visualizer_input_failed','visualizer_usage']);
const scalar = value => typeof value === 'string' && value.length <= 100 ? value : undefined;
const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value) ? value : undefined;

export function pageContext(href) {
  const url = new URL(href);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    let section = url.hash.slice(1).split('?')[0];
    if (!sections.includes(section)) section = 'home';
    if (section === 'web' || section === 'extras') section = 'dnd';
    if (section === 'contact') section = 'about';
    if (section === 'tools' || section === 'skins') section = 'plugins'; // held release
    return {page: section, $current_url:`https://ullhexa.com/#${section}`, $pathname:'/'};
  }
  const match = url.pathname.match(/^\/plugins\/([^/]+)\/(download\/|documentation\/)?(?:index\.html)?$/);
  if (match && PLUGINS.includes(match[1])) {
    const stage = match[2] === 'download/' ? 'download' : match[2] ? 'documentation' : 'product';
    const path = `/plugins/${match[1]}/${match[2] || ''}`;
    return {page:stage, plugin:match[1], $current_url:`https://ullhexa.com${path}`, $pathname:path};
  }
  if (url.pathname === '/visualizers.html') return {page:'visualizer', $current_url:'https://ullhexa.com/visualizers.html', $pathname:'/visualizers.html'};
  // Privacy, iframe documentation, legacy redirects and unknown paths aren't tracked.
  return null;
}

export function campaignContext(href, referrer) {
  const result = {};
  try {
    const url = new URL(href);
    for (const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
      const value = url.searchParams.get(key);
      if (value && /^[a-z0-9][a-z0-9_.-]{0,63}$/i.test(value)) result[key] = value;
    }
    const host = referrer ? new URL(referrer).hostname : '';
    const external = host && !['ullhexa.com','www.ullhexa.com',url.hostname].includes(host);
    result.$referring_domain = external ? host : '$direct';
    result.$referrer = external ? `https://${host}/` : '$direct';
  } catch { /* A malformed referrer must not break the website. */ }
  return result;
}

export function allowedProperties(props = {}) {
  const out = {};
  if (PLUGINS.includes(props.plugin)) out.plugin = props.plugin;
  if ([...sections,'product','download','documentation','visualizer'].includes(props.page)) out.page = props.page;
  if (['midi','audio'].includes(props.family)) out.family = props.family;
  if (Object.values(SCENES).some(modes => Object.values(modes).includes(props.scene))) out.scene = props.scene;
  if (inputs.includes(props.input)) out.input = props.input;
  if (['permission_denied','unsupported','no_audio','unavailable'].includes(props.reason)) out.reason = props.reason;
  if (typeof props.version === 'string' && /^\d+\.\d+\.\d+(?:[.-][a-z0-9]+)*$/i.test(props.version)) out.version = props.version;
  for (const key of ['visible_seconds','running_seconds']) {
    if (Number.isFinite(props[key])) out[key] = Math.max(0, Math.min(3600, Math.round(props[key])));
  }
  if (uuid(props.view_id)) out.view_id = props.view_id;
  if (Number.isFinite(props.$prev_pageview_duration)) out.$prev_pageview_duration = Math.max(0, Math.min(86400, props.$prev_pageview_duration));
  return out;
}

// SDK defaults must not leak a contact query, a device name, text, or ad click IDs.
export function filterEvent(event, allowed) {
  if (!allowed || !event || !actions.has(event.event)) return null;
  const p = event.properties || {};
  const context = p.$current_url ? pageContext(p.$current_url) : null;
  if (!context) return null;
  // The SDK derives its ingestion api_key from properties.token after before_send.
  // Keep our public project token while discarding arbitrary supplied fields.
  const clean = {...allowedProperties(p), ...context, token:PROJECT_TOKEN};
  for (const key of ['distinct_id','$device_id','$session_id','$window_id','$pageview_id','$prev_pageview_id']) {
    if (uuid(p[key])) clean[key] = p[key];
  }
  for (const key of ['$browser','$browser_version','$os','$os_version','$device_type','$lib','$lib_version']) {
    if (scalar(p[key])) clean[key] = p[key];
    else if (key === '$browser_version' && Number.isFinite(p[key])) clean[key] = p[key];
  }
  Object.assign(clean, campaignContext(`https://ullhexa.com/?${new URLSearchParams(
    Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content'].filter(k => typeof p[k] === 'string').map(k => [k,p[k]])))}`, p.$referrer === '$direct' ? '' : p.$referrer));
  clean.$geoip_disable = true;
  clean.$process_person_profile = false;
  clean.$is_identified = false;
  clean.analytics_schema = 1;
  return {uuid:event.uuid,event:event.event,properties:clean,timestamp:event.timestamp};
}

export function sdkConfig(beforeSend) {
  return {
    api_host:API_HOST, ui_host:'https://eu.posthog.com', defaults:'2025-05-24',
    persistence:'localStorage', persistence_name:'ullhexa_analytics',
    person_profiles:'never', ip:false, property_blacklist:['$ip','$raw_user_agent'],
    autocapture:false, capture_pageview:false, capture_pageleave:false,
    capture_dead_clicks:false, rageclick:false, capture_heatmaps:false,
    capture_performance:false, capture_exceptions:false,
    disable_session_recording:true, disable_surveys:true,
    advanced_disable_flags:true, advanced_disable_decide:true,
    save_campaign_params:false, save_referrer:false,
    request_batching:false, before_send:beforeSend
  };
}
