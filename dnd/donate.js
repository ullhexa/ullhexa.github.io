// Open PayPal in a new tab so its SDK cannot navigate the embedded game frame.
const container = document.getElementById('donate-button-container');

// Match the site's initial-press behavior without replaying the release click.
let activating = false, suppressClick = false;
function activate(event) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const control = event.target.closest('a');
  if (!control || !container.contains(control)) return;
  if (event.type === 'pointerdown' && (event.button !== 0 || !event.isPrimary)) return;
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.repeat) return;
  suppressClick = true;
  activating = true;
  try { control.click(); } finally { activating = false; }
}
container.addEventListener('pointerdown', activate, true);
container.addEventListener('keydown', activate, true);
container.addEventListener('click', event => {
  if (!activating && suppressClick) {
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

