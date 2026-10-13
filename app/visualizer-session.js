export const MODES = {
  midi: ['squares', 'plane', 'plasma', 'rubik'],
  audio: ['stereo-osc', 'fractals', 'cat']
};

export function selectionFromURL(url) {
  const params = new URL(url).searchParams;
  const family = params.get('family') === 'midi' ? 'midi' : 'audio';
  const mode = params.get('mode') || (family === 'audio' && ['smooth', 'previous'].includes(params.get('catBounce')) ? 'cat' : null);
  return { family, mode: MODES[family].includes(mode) ? mode : MODES[family][0] };
}

// Engines retain their own settings and input connections. Only rendering/input
// ownership changes when the user switches families; neither engine is recreated.
export function createVisualizerSession(engines) {
  let selection = null;
  return {
    get selection() { return selection; },
    select(family, mode) {
      if (!MODES[family]?.includes(mode)) return false;
      if (selection?.family === family && selection.mode === mode) return false;
      if (selection?.family !== family) {
        if (selection) engines[selection.family].setActive(false);
        engines[family].setMode(mode);
        engines[family].setActive(true);
      } else {
        engines[family].setMode(mode);
      }
      selection = { family, mode };
      return true;
    }
  };
}
