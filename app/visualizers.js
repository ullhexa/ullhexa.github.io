import * as audio from './audio-visualizers.js?v=20261002-font';
import * as midi from './midi-visualizers.js?v=20260930d';
import { createVisualizerSession, selectionFromURL } from './visualizer-session.js';

const session = createVisualizerSession({ audio, midi });
const menus = [...document.querySelectorAll('.modeMenu')];
const canvases = { audio: document.getElementById('canvas'), midi: document.getElementById('midiCanvas') };

function closeMenus() {
  for (const menu of menus) {
    menu.querySelector('.modeMenuToggle').setAttribute('aria-expanded', 'false');
    menu.querySelector('.modeDropdown').hidden = true;
  }
}

function select(family, mode, remember = false) {
  if (!session.select(family, mode)) return;
  document.body.dataset.family = family;
  for (const menu of menus) {
    menu.classList.toggle('is-current', menu.dataset.family === family);
    for (const button of menu.querySelectorAll('[data-mode]')) {
      const selected = menu.dataset.family === family && button.dataset.mode === mode;
      if (selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
  }
  if (remember) {
    const url = new URL(location.href);
    url.searchParams.set('family', family);
    url.searchParams.set('mode', mode);
    history.pushState(null, '', url);
  }
}

for (const menu of menus) {
  const toggle = menu.querySelector('.modeMenuToggle');
  const dropdown = menu.querySelector('.modeDropdown');
  const buttons = [...dropdown.querySelectorAll('[data-mode]')];
  const open = () => {
    closeMenus();
    toggle.setAttribute('aria-expanded', 'true');
    dropdown.hidden = false;
  };
  toggle.addEventListener('click', () => {
    if (dropdown.hidden) open();
    else closeMenus();
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenus();
      toggle.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const index = buttons.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : index < 0 ? (event.key === 'ArrowUp' ? buttons.length - 1 : 0)
        : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
      open();
      buttons[next].focus();
    }
  });
  for (const button of buttons) button.addEventListener('click', () => {
    select(menu.dataset.family, button.dataset.mode, true);
    closeMenus();
    canvases[menu.dataset.family].focus({ preventScroll: true });
  });
}

document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.modeMenu')) closeMenus();
});
document.addEventListener('focusin', event => {
  if (!event.target.closest('.modeMenu')) closeMenus();
});
window.addEventListener('popstate', () => {
  closeMenus();
  const { family, mode } = selectionFromURL(location.href);
  select(family, mode);
});
const { family, mode } = selectionFromURL(location.href);
select(family, mode);
