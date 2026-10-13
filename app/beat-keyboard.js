// Space belongs to the shared groove clock in every visualizer and View mode.
// Capture both edges so focused buttons cannot also click on Space release.
export function bindTapKeyboard(target, tap) {
  let held = false;
  const isSpace = event => event.code === 'Space' || event.key === ' ';
  const editing = element => element?.isContentEditable || element?.closest?.('textarea, input:not([type="range"]):not([type="button"]):not([type="submit"]), [contenteditable="true"], [role="textbox"]');
  const down = event => {
    if (!isSpace(event) || event.altKey || event.ctrlKey || event.metaKey || editing(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!held && !event.repeat) tap(event.timeStamp);
    held = true;
  };
  const up = event => {
    if (!isSpace(event) || !held) return;
    event.preventDefault();
    event.stopPropagation();
    held = false;
  };
  const blur = () => { held = false; };
  target.addEventListener('keydown', down, true);
  target.addEventListener('keyup', up, true);
  target.defaultView?.addEventListener('blur', blur);
  return () => {
    target.removeEventListener('keydown', down, true);
    target.removeEventListener('keyup', up, true);
    target.defaultView?.removeEventListener('blur', blur);
  };
}
