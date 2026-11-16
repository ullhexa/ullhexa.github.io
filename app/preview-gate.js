import { bindPressActions } from './press-action.js?v=20261110-link-fix';

// A temporary presentation gate for a static site, not server authentication.
// Direct product URLs and assets remain public. Remove via homepage_mode: full.
const PREVIEW_PIN = '1937';
const SESSION_KEY = 'ullhexa-site-preview-20261116';

export function mountPreviewGate(onUnlock) {
  const body = document.body;
  if (body.dataset.previewGate !== 'pin') return { isLocked: () => false };

  let unlocked = false;
  try { unlocked = sessionStorage.getItem(SESSION_KEY) === PREVIEW_PIN; } catch {}
  body.classList.toggle('previewLockedMode', !unlocked);
  if (unlocked) return { isLocked: () => false };

  const form = document.createElement('form');
  form.className = 'previewGate';
  form.noValidate = true;
  form.setAttribute('aria-label', 'Website preview');
  form.innerHTML = `
    <label for="previewPin">PIN</label>
    <div class="previewGateControls">
      <input id="previewPin" name="pin" type="password" inputmode="numeric"
        pattern="[0-9]{4}" maxlength="4" autocomplete="off" required
        aria-describedby="previewPinStatus" />
      <button type="submit" class="simpleBoxButton">Enter</button>
    </div>
    <p id="previewPinStatus" role="alert"></p>`;
  body.querySelector('.site-header').append(form);
  const input = form.querySelector('input');
  const status = form.querySelector('[role="alert"]');
  const unbindPress = bindPressActions(form, { selector: 'button' });

  input.addEventListener('input', () => {
    status.textContent = '';
    input.removeAttribute('aria-invalid');
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (unlocked) return;
    if (input.value.trim() !== PREVIEW_PIN) {
      status.textContent = input.value ? 'Incorrect PIN.' : 'Enter the PIN.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      input.select();
      return;
    }
    unlocked = true;
    try { sessionStorage.setItem(SESSION_KEY, PREVIEW_PIN); } catch {}
    unbindPress();
    form.remove();
    body.classList.remove('previewLockedMode');
    onUnlock();
    body.querySelector('.nav a')?.focus({ preventScroll: true });
  });

  return { isLocked: () => !unlocked };
}
