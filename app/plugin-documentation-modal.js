import { bindPressActions } from './press-action.js?v=20261120-touch-taps';

// Share the exact release documents with the standalone fallback pages. Load
// their text only when requested, without navigating away from the product.
export function mountPluginDocumentation(root, plugin) {
  const doc = root.ownerDocument;
  const dialog = doc.createElement('dialog');
  dialog.id = 'pluginDocumentationDialog';
  dialog.className = 'pluginDocumentDialog';
  dialog.setAttribute('aria-labelledby', 'pluginDocumentTitle');
  dialog.innerHTML = `<header class="pluginDocumentHeader">
    <div><h2 id="pluginDocumentTitle"></h2><p class="pluginDocumentVersion"></p></div>
    <button class="pluginDocumentClose" type="button" aria-label="Close user guide and licence" autofocus>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
    </button>
  </header>
  <nav class="pluginDocumentNavigation" aria-label="Document sections">
    <button type="button" data-document-section="user-guide">User guide</button>
    <button type="button" data-document-section="licence">Licence</button>
  </nav>
  <div class="pluginDocumentScroll" tabindex="0" role="region" aria-label="User guide and licence text"></div>`;
  dialog.querySelector('h2').textContent = `${plugin.title} user guide and licence`;
  dialog.querySelector('.pluginDocumentVersion').textContent = `Version ${plugin.version}`;
  const body = dialog.querySelector('.pluginDocumentScroll');
  const close = dialog.querySelector('.pluginDocumentClose');
  doc.body.append(dialog);
  bindPressActions(dialog);
  let opener;
  let loaded = false;
  let loading = false;

  async function loadDocuments() {
    if (loaded || loading) return;
    loading = true;
    body.setAttribute('aria-busy', 'true');
    body.innerHTML = '<p role="status">Loading user guide and licence…</p>';
    try {
      // A revised installer can retain its version while its bundled documents change.
      const revision = plugin.download?.sha256 || plugin.version;
      const response = await fetch(`${plugin.page}documentation/?v=${encodeURIComponent(revision)}`);
      if (!response.ok) throw new Error(`Documentation unavailable (${response.status})`);
      const source = new DOMParser().parseFromString(await response.text(), 'text/html');
      const content = doc.createDocumentFragment();
      for (const id of ['user-guide', 'licence']) {
        const original = source.querySelector(`#${id}`);
        const heading = original?.querySelector('h2');
        const text = original?.querySelector('.documentText');
        if (!heading || !text) throw new Error('Incomplete release documentation');
        const section = doc.createElement('section');
        section.id = `plugin-document-${id}`;
        const title = doc.createElement('h3');
        title.textContent = heading.textContent;
        const paragraphs = doc.createElement('div');
        paragraphs.className = 'pluginDocumentText';
        paragraphs.textContent = text.textContent;
        section.append(title, paragraphs);
        content.append(section);
      }
      body.replaceChildren(content);
      loaded = true;
    } catch {
      body.innerHTML = '<p role="status">The documents could not be loaded. Please try again.</p><button type="button" data-document-retry>Try again</button>';
    } finally {
      loading = false;
      body.removeAttribute('aria-busy');
    }
  }

  root.addEventListener('click', event => {
    const link = event.target.closest('a[data-plugin-documentation]');
    if (!link || !root.contains(link) || event.defaultPrevented || event.button > 0 ||
        event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    if (dialog.open) return;
    opener = link;
    doc.documentElement.classList.add('hasPluginDocumentation');
    dialog.showModal();
    body.scrollTop = 0;
    void loadDocuments();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    doc.documentElement.classList.remove('hasPluginDocumentation');
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-document-retry]')) void loadDocuments();
    const jump = event.target.closest('[data-document-section]');
    if (!jump) return;
    const section = body.querySelector(`#plugin-document-${jump.dataset.documentSection}`);
    if (section) body.scrollTo({ top: body.scrollTop + section.getBoundingClientRect().top - body.getBoundingClientRect().top - 24, behavior: 'instant' });
  });
}
