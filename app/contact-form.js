// Browser validation is feedback, not a replacement for the mail provider's
// server-side spam checks. Do not describe local storage as an IP/email quota.
export const CONTACT_LIMITS = Object.freeze({ name: 120, email: 254, subject: 180, message: 5000 });

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateContact(values) {
  if (!values.name.trim() || !values.email.trim() || !values.message.trim()) {
    return { message: 'Please fill in your name, email, and message before sending.', tone: 'warning' };
  }
  if (!isValidEmail(values.email)) return { message: 'Please enter a valid email address.', tone: 'error' };
  if (Object.entries(CONTACT_LIMITS).some(([key, limit]) => values[key].length > limit)) {
    return { message: 'Please shorten the fields that exceed their character limit.', tone: 'warning' };
  }
  return null;
}

export function mountContactForm(root, config, { send = globalThis.fetch } = {}) {
  const form = root.querySelector('#contactForm');
  if (!form) return () => {};
  const fields = Object.fromEntries(Object.keys(CONTACT_LIMITS).map(key => [key, form.elements.namedItem(key)]));
  const button = form.querySelector('#contactSubmitBtn');
  const status = form.querySelector('#contactStatus');
  const ready = Boolean(config?.accessKey && !config.accessKey.startsWith('YOUR_'));
  let attempted = false;
  let sending = false;
  let disposed = false;

  const setStatus = (message = '', tone = 'neutral') => {
    status.textContent = message;
    status.dataset.tone = tone;
  };
  const values = () => Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
  const updateLimits = () => {
    for (const [key, field] of Object.entries(fields)) {
      const hint = form.querySelector(`#${field.id}Limit`);
      if (hint) hint.textContent = field.value.length >= CONTACT_LIMITS[key] ? 'Character limit reached' : '';
    }
  };
  const updateFeedback = () => {
    updateLimits();
    if (sending) return;
    if (!ready) { setStatus('Form sending is not activated yet.', 'warning'); return; }
    if (fields.email.value.trim() && !isValidEmail(fields.email.value)) {
      setStatus('Please enter a valid email address.', 'error'); return;
    }
    const error = attempted ? validateContact(values()) : null;
    setStatus(error?.message, error?.tone);
  };

  const submit = async event => {
    event.preventDefault();
    if (sending || !ready || disposed) return;
    attempted = true;
    const input = values();
    const error = validateContact(input);
    if (error) { setStatus(error.message, error.tone); return; }
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending...';
    setStatus('Sending message...');
    try {
      const response = await send('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: config.accessKey,
          subject: input.subject.trim() || `New message for ${config.label}`,
          from_name: input.name.trim(), email: input.email.trim(), message: input.message.trim(),
          to_name: config.label, botcheck: ''
        })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.message || 'Unable to send message.');
      if (disposed) return;
      form.reset();
      attempted = false;
      updateLimits();
      setStatus('Message sent successfully.', 'success');
    } catch (error) {
      if (!disposed) setStatus(error.message || 'Unable to send message right now.', 'error');
    } finally {
      sending = false;
      if (!disposed) {
        button.disabled = !ready;
        button.textContent = 'Send message';
      }
    }
  };

  for (const [key, field] of Object.entries(fields)) {
    field.maxLength = CONTACT_LIMITS[key];
    field.addEventListener('input', updateFeedback);
    field.addEventListener('change', updateFeedback);
  }
  form.addEventListener('submit', submit);
  button.disabled = !ready;
  updateFeedback();
  return () => {
    disposed = true;
    form.removeEventListener('submit', submit);
    for (const field of Object.values(fields)) {
      field.removeEventListener('input', updateFeedback);
      field.removeEventListener('change', updateFeedback);
    }
  };
}
