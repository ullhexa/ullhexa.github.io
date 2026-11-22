import {analyticsFor} from './analytics.js?v=20261122-analytics2';
import {SCENES} from './analytics-policy.js?v=20261122-analytics2';

// No note values, amplitudes, audio buffers or hardware names enter this module.
export function createVisualizerAnalytics(doc, analytics) {
  const win = doc.defaultView;
  let selection = null, activeInput = 'none', lastActivity = -Infinity;
  let lastTick = win.performance.now(), seconds = 0;
  let started = new Set(), wasVisible = doc.visibilityState === 'visible';
  const props = input => ({...selection,input});
  const tick = () => {
    const now = win.performance.now();
    // MIDI/keyboard use stays active for 30 seconds after the latest signal.
    // Audio activity is refreshed by the engine while non-silent audio arrives.
    if (analytics.isEnabled() && selection && wasVisible) {
      const until = Math.min(now,lastActivity+30000);
      seconds += Math.max(0,until-lastTick)/1000;
    }
    lastTick = now;
    wasVisible = doc.visibilityState === 'visible';
  };
  const flush = () => {
    tick();
    if (seconds >= 1 && selection) analytics.capture('visualizer_usage',{...props(activeInput),running_seconds:seconds},true);
    seconds = 0;
  };
  const open = () => {
    seconds=0; lastTick=win.performance.now(); started=new Set();
    if (selection) analytics.capture('visualizer_opened',props('none'));
  };
  const unsubscribe = analytics.subscribe(enabled => {seconds=0; lastTick=win.performance.now(); started.clear(); if(enabled) open();});
  const timer = win.setInterval(flush,60000);
  const visibility = () => {flush(); lastTick=win.performance.now();};
  doc.addEventListener('visibilitychange',visibility);
  win.addEventListener('pagehide',flush);
  return {
    select(family,mode) {
      const scene = SCENES[family]?.[mode];
      if (!scene || (selection?.scene === scene && selection?.family === family)) return;
      flush(); selection={family,scene}; activeInput='none'; lastActivity=-Infinity; open();
    },
    attempt(input) { if(selection) analytics.capture('visualizer_input_attempted',props(input)); },
    ready(input) { if(selection) analytics.capture('visualizer_input_ready',props(input)); },
    failed(input,reason) { if(selection) analytics.capture('visualizer_input_failed',{...props(input),reason}); },
    activity(input) {
      const now=win.performance.now();
      if (!selection || (['mic','shared_tab'].includes(input) ? selection.family !== 'audio' : selection.family !== 'midi')) return;
      if (activeInput === input && now-lastActivity < 1000) return;
      if (activeInput !== input) {flush(); activeInput=input;}
      tick(); lastActivity=now;
      if (analytics.isEnabled() && !started.has(input)) {
        started.add(input); analytics.capture('visualizer_input_started',props(input));
      }
    },
    stop(input) { if (activeInput === input) {flush(); activeInput='none'; lastActivity=-Infinity;} started.delete(input); },
    destroy() {flush(); unsubscribe(); win.clearInterval(timer); doc.removeEventListener('visibilitychange',visibility); win.removeEventListener('pagehide',flush);}
  };
}
let tracker;
export const visualizerAnalytics = () => tracker ||= createVisualizerAnalytics(document,analyticsFor(document));
