// Use for momentary website controls that should act as soon as they are pressed.
// Native click remains available to assistive technology and modified link gestures.
export function bindPressActions(root, { selector = 'button, a[href]' } = {}) {
  const doc = root.ownerDocument;
  let pressed = null;
  let pointerActivation = null;
  let forwarding = false;

  const controlFor = event => {
    const control = event.target.closest?.(selector);
    return control && root.contains(control) && !control.disabled &&
      control.getAttribute('aria-disabled') !== 'true' ? control : null;
  };
  const modified = event => event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
  const release = () => {
    pressed?.classList.remove('isPressing');
    pressed = null;
  };
  const press = control => {
    release();
    pressed = control;
    control.classList.add('isPressing');
  };
  const activate = control => {
    forwarding = true;
    try { control.click(); } finally { forwarding = false; }
  };
  const pointerDown = event => {
    if (event.defaultPrevented || event.button !== 0 || event.isPrimary === false || modified(event)) return;
    const control = controlFor(event);
    if (!control) return;
    event.preventDefault();
    control.focus({ preventScroll: true });
    press(control);
    pointerActivation = control;
    activate(control);
  };
  const click = event => {
    // The forwarded click runs the existing action. Consume only the later
    // pointer-generated click, so release cannot navigate or submit twice.
    // A null match is an ordinary, unmanaged link/control, not a release pair.
    if (pointerActivation && !forwarding && !modified(event) && event.detail > 0 && controlFor(event) === pointerActivation) {
      event.preventDefault();
      event.stopImmediatePropagation();
      pointerActivation = null;
    }
  };
  const keyDown = event => {
    if (event.defaultPrevented || modified(event) || !['Enter', ' '].includes(event.key)) return;
    const control = controlFor(event);
    if (!control) return;
    event.preventDefault();
    if (event.repeat) return;
    pointerActivation = null;
    press(control);
    activate(control);
  };
  const keyUp = event => {
    if (!modified(event) && ['Enter', ' '].includes(event.key) && controlFor(event)) {
      event.preventDefault();
      release();
    }
  };
  root.addEventListener('pointerdown', pointerDown);
  root.addEventListener('click', click, true);
  root.addEventListener('keydown', keyDown);
  root.addEventListener('keyup', keyUp);
  root.addEventListener('focusout', release);
  doc.addEventListener('pointerup', release, true);
  doc.addEventListener('pointercancel', release, true);
  doc.defaultView?.addEventListener('blur', release);
  return () => {
    release();
    root.removeEventListener('pointerdown', pointerDown);
    root.removeEventListener('click', click, true);
    root.removeEventListener('keydown', keyDown);
    root.removeEventListener('keyup', keyUp);
    root.removeEventListener('focusout', release);
    doc.removeEventListener('pointerup', release, true);
    doc.removeEventListener('pointercancel', release, true);
    doc.defaultView?.removeEventListener('blur', release);
  };
}
