import { bindPressActions } from './press-action.js?v=20261120-touch-taps';

export const CONTACT_EMAIL = 'ullhexa.music@gmail.com';

export function renderContact() {
  return `<section class="contactShell" aria-label="Contact Ull Hexa">
    <div class="contactPanel contactIdentity">
      <div class="contactIdentityGlow" aria-hidden="true"></div>
      <p class="contactRole">Ull Hexa</p>
      <h3>Direct contact</h3>
      <div class="contactEmailRow">
        <span class="contactEmailText">${CONTACT_EMAIL}</span>
        <button type="button" class="contactCopyButton simpleBoxButton" aria-label="Copy email address" title="Copy email address">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="1"/><path d="M15 5V3H3v13h2"/></svg>
        </button>
      </div>
      <a class="contactEmailButton simpleBoxButton" href="mailto:${CONTACT_EMAIL}">Open email</a>
      <p class="contactStatus" role="status" aria-live="polite"></p>
    </div>
  </section>`;
}

export function mountContact(root, {
  writeText = text => globalThis.navigator.clipboard.writeText(text),
  bindActions = bindPressActions
} = {}) {
  const button = root.querySelector('.contactCopyButton');
  const status = root.querySelector('.contactStatus');
  let disposed = false;
  let copying = false;
  const copy = async () => {
    if (copying || disposed) return;
    copying = true;
    try {
      // Start within the user gesture, including Safari's clipboard permission window.
      await writeText(CONTACT_EMAIL);
      if (!disposed) status.textContent = 'Email address copied.';
    } catch {
      if (!disposed) status.textContent = 'Copy unavailable. Select the email address and copy it manually.';
    } finally {
      copying = false;
    }
  };
  button.addEventListener('click', copy);
  const unbind = bindActions(root, { selector: '.contactCopyButton, .contactEmailButton' });
  return () => {
    disposed = true;
    button.removeEventListener('click', copy);
    unbind();
  };
}
