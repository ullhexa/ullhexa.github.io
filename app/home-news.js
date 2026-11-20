import { bindNewsTouchScrollOrder, newsScrollBoundary, bindPhoneNewsScroll, PHONE_NEWS_QUERY } from './news-touch-scroll.js?v=20261120-phone-sized-news';
import { newsPage } from './news-latest.js?v=20261115-news-technical-copy';
import { bindPressActions } from './press-action.js?v=20261120-touch-taps';

const escapeHTML = text => String(text).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function renderNewsPosts(posts) {
  return posts.map(post => {
    const href = post.href || (post.family && post.mode ? `./visualizers.html?family=${post.family}&mode=${post.mode}` : '');
    const image = post.image ? encodeURI(post.image) : './assets/Ull_Hexa_sub_white.svg';
    const title = escapeHTML(post.title);
    const linkAttributes = href ? `href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer"` : '';
    // Stack order is back to front. Each real preview keeps its own proportions.
    const stack = Array.isArray(post.imageStack) ? post.imageStack.slice(0, 4) : [];
    const badgeClass = `newsBadge${stack.length ? ' newsBadgeStack' : post.image ? '' : ' newsBadgeLogo'}`;
    const badge = stack.length ? stack.map((src, index) =>
      `<img data-news-src="${escapeHTML(encodeURI(src))}" alt="${index === stack.length - 1 ? escapeHTML(post.imageAlt || post.title + ' previews') : ''}" width="1785" height="1157" loading="lazy" decoding="async" />`
    ).join('') : `<img data-news-src="${escapeHTML(image)}" alt="${post.image ? escapeHTML(post.imageAlt || post.title + ' preview') : 'Ull Hexa'}" width="${post.image ? 1080 : 897}" height="${post.image ? 1080 : 479}" loading="lazy" decoding="async" />`;
    return `<article class="newsPost" tabindex="-1" aria-labelledby="news-${escapeHTML(post.id)}">
      <div class="newsMeta">
        <time datetime="${escapeHTML(post.date)}">${dateFormat.format(new Date(`${post.date}T12:00:00Z`))}</time>${post.category ? `<span class="newsCategory"> - ${escapeHTML(post.category)}</span>` : ''}
      </div>
      <div class="newsVisual">
        ${href ? `<a class="${badgeClass}" ${linkAttributes} aria-label="Open ${title} (opens in a new tab)">${badge}</a>` : `<div class="${badgeClass}">${badge}</div>`}
      </div>
      <div class="newsCopy">
        <h3 id="news-${escapeHTML(post.id)}">${href ? `<a ${linkAttributes}>${title}</a>` : title}</h3>
        ${post.summary ? `<p class="newsSummary">${escapeHTML(post.summary)}</p>` : ''}
        ${post.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('')}
        ${post.links?.length ? `<div class="newsReleaseLinks" role="group" aria-label="Listen to ${title}">${post.links.map(link => `<a href="${escapeHTML(link.href)}" target="_blank" rel="noopener noreferrer" aria-label="Listen to ${title} on ${escapeHTML(link.label)} (opens in a new tab)">${escapeHTML(link.label)} <span aria-hidden="true">↗</span></a>`).join('')}</div>` : ''}
      </div>
    </article>`;
  }).join('');
}

// Keep every number visible through ten pages, then show a compact window.
export function newsPageNumbers(current, total) {
  if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(current - 2, total - 6));
  const end = Math.min(total - 1, Math.max(current + 2, 7));
  return [1, ...(start > 2 ? ['…'] : []),
    ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
    ...(end < total - 1 ? ['…'] : []), total];
}

export function renderNewsPagination(current, total) {
  const arrow = (direction, target, disabled) => `<button type="button" class="newsPageArrow" data-news-page="${target}" aria-label="${direction === 'previous' ? 'Previous' : 'Next'} news page"${disabled ? ' disabled' : ''}><svg viewBox="0 0 12 18" aria-hidden="true" focusable="false"><path d="${direction === 'previous' ? 'M12 0 0 9 12 18Z' : 'M0 0 12 9 0 18Z'}" /></svg></button>`;
  return `<div class="newsPageNumbers">${arrow('previous', current - 1, current === 1)}${newsPageNumbers(current, total).map(page => page === '…'
    ? '<span class="newsPageGap" aria-hidden="true">…</span>'
    : `<button type="button" class="newsPageNumber" data-news-page="${page}" aria-label="News page ${page}"${page === current ? ' aria-current="page"' : ''}>${page}</button>`).join('')}${arrow('next', current + 1, current === total)}</div>`;
}

export function renderHomeNews(page = newsPage) {
  return `<section class="contactPanel homeNews" aria-labelledby="homeNewsTitle">
    <h2 id="homeNewsTitle">Latest Projects</h2>
    <div id="homeNewsFeed" class="newsFeed" tabindex="0" role="region" aria-label="News posts, newest first">
      <div class="newsPosts">${renderNewsPosts(page.posts)}</div>
      <div class="newsPaging">
        <nav class="newsPagination" aria-label="News pages">${renderNewsPagination(1, page.totalPages)}</nav>
        <p class="newsStatus" role="status" aria-live="polite"></p>
      </div>
    </div>
  </section>`;
}

// The small page directory is fetched only on the first archive selection.
// Direct jumps never fetch intervening posts. Keep the latest page plus four
// recently read pages in memory; a new selection cancels the previous request.
export function createNewsPager(initialPage, fetchPage = fetch) {
  const totalPages = initialPage.totalPages;
  const cache = new Map([[1, initialPage.posts]]);
  let current = 1, directory = null, pending = null, controller = null, revision = 0, disposed = false;
  const request = async (url, signal) => {
    const response = await fetchPage(url, { signal });
    if (!response.ok) throw new Error('News request failed');
    return response.json();
  };
  return {
    get current() { return current; },
    async load(number) {
      if (disposed || !Number.isInteger(number) || number < 1 || number > totalPages || pending === number) return null;
      if (number === current && pending === null) return null;
      const version = ++revision;
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      pending = number;
      try {
        let entries = cache.get(number);
        if (!entries) {
          if (!directory) {
            if (!/^\.\/assets\/news\/index-[a-f0-9]{16}\.json$/.test(initialPage.index)) throw new Error('Invalid news directory');
            const index = await request(initialPage.index, signal);
            if (disposed || version !== revision) return null;
            if (!Array.isArray(index.pages) || index.pages.length !== totalPages || index.pages[0] !== null ||
                !index.pages.slice(1).every(url => /^\.\/assets\/news\/archive-[a-f0-9]{16}\.json$/.test(url))) throw new Error('Invalid news directory');
            directory = index.pages;
          }
          const page = await request(directory[number - 1], signal);
          if (disposed || version !== revision) return null;
          if (!Array.isArray(page.posts) || page.posts.length > 8) throw new Error('Invalid news page');
          entries = page.posts;
        }
        if (disposed || version !== revision) return null;
        cache.delete(number);
        cache.set(number, entries);
        while (cache.size > 5) cache.delete([...cache.keys()].find(key => key !== 1));
        current = number;
        return entries;
      } finally {
        if (version === revision) pending = null;
      }
    },
    dispose() { disposed = true; revision++; controller?.abort(); cache.clear(); }
  };
}

// Wheel/trackpad scrolling brings the panel into view before moving its posts.
// Taller-than-viewport panels hand off with their heading near the top, so the
// newest post is not skipped. Reverse scrolling returns through the feed first.
// Zoom, keyboard and direct scrollbar use stay native.
function bindTallNewsScrollOrder(feed) {
  const document = feed.ownerDocument;
  const onWheel = event => {
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const mode = event.deltaMode;
    const delta = event.deltaY;
    if (!delta || Math.abs(event.deltaX) > Math.abs(delta)) return;
    const page = document.scrollingElement;
    if (!page) return;
    const lineHeight = mode === 1 ? parseFloat(document.defaultView.getComputedStyle(feed).lineHeight) || 16 : 1;
    const pixels = delta * (mode === 2 ? page.clientHeight : lineHeight);
    if (pixels < 0) {
      const feedRemaining = Math.max(0, feed.scrollTop);
      if (page.scrollTop <= 0 || -pixels <= feedRemaining) return;
      event.preventDefault();
      feed.scrollTop = 0;
      page.scrollTop = Math.max(0, page.scrollTop + pixels + feedRemaining);
      return;
    }
    const boundary = newsScrollBoundary(feed, page);
    const remaining = Math.max(0, boundary - page.scrollTop);
    if (remaining <= 1) return;
    event.preventDefault();
    const pagePixels = Math.min(pixels, remaining);
    page.scrollTop += pagePixels;
    // Carry a boundary-crossing gesture into the news without a pause or jump.
    if (pixels > pagePixels) feed.scrollTop += pixels - pagePixels;
  };
  feed.addEventListener('wheel', onWheel, { passive: false });
  const unbindTouch = bindNewsTouchScrollOrder(feed);
  return () => {
    feed.removeEventListener('wheel', onWheel);
    unbindTouch();
  };
}

// Rebind on rotation/window resize, so phone mode has no wheel or touch routing.
export function bindNewsScrollOrder(feed) {
  const compact = feed.ownerDocument.defaultView.matchMedia?.(PHONE_NEWS_QUERY);
  let unbind = () => {};
  const configure = () => {
    unbind();
    unbind = compact?.matches ? bindPhoneNewsScroll(feed) : bindTallNewsScrollOrder(feed);
  };
  configure();
  compact?.addEventListener('change', configure);
  return () => {
    compact?.removeEventListener('change', configure);
    unbind();
  };
}

export function mountHomeNews(root, initialPage = newsPage) {
  const news = root.querySelector('.homeNews');
  const feed = news.querySelector('.newsFeed');
  const posts = news.querySelector('.newsPosts');
  const pagination = news.querySelector('.newsPagination');
  const status = news.querySelector('.newsStatus');
  const pager = createNewsPager(initialPage);
  const unbindScrollOrder = bindNewsScrollOrder(feed);
  let disposed = false;

  let imageObserver, visibilityObserver, imagesActive = false;
  const loadImage = image => {
    image.src = image.dataset.newsSrc;
    delete image.dataset.newsSrc;
  };
  const observeImages = () => {
    if (!imagesActive) return;
    posts.querySelectorAll('img[data-news-src]').forEach(image => imageObserver ? imageObserver.observe(image) : loadImage(image));
  };
  if (typeof IntersectionObserver === 'function') {
    imageObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        loadImage(entry.target);
        imageObserver.unobserve(entry.target);
      }
    }, { root: feed, rootMargin: '200px 0px' });
    visibilityObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      imagesActive = true;
      observeImages();
      visibilityObserver.disconnect();
    }, { rootMargin: '300px 0px' });
    visibilityObserver.observe(news);
  } else {
    imagesActive = true;
    observeImages();
  }

  let selection = 0, pendingPage = null;
  const changePage = async event => {
    const button = event.target.closest('[data-news-page]');
    if (!button || !pagination.contains(button) || button.disabled || disposed) return;
    const number = Number(button.dataset.newsPage);
    if (number === pendingPage || (number === pager.current && pendingPage === null)) return;
    const version = ++selection;
    pendingPage = number;
    status.textContent = `Loading page ${number}…`;
    posts.setAttribute('aria-busy', 'true');
    try {
      const entries = await pager.load(number);
      if (disposed || version !== selection || !entries) return;
      imageObserver?.disconnect();
      posts.innerHTML = renderNewsPosts(entries);
      pagination.innerHTML = renderNewsPagination(pager.current, initialPage.totalPages);
      observeImages();
      status.textContent = '';
      feed.scrollTop = 0;
      feed.focus({ preventScroll: true });
    } catch (error) {
      if (disposed || version !== selection || error.name === 'AbortError') return;
      status.textContent = `Could not load page ${number}. Select it again to retry.`;
    } finally {
      if (!disposed && version === selection) {
        pendingPage = null;
        posts.removeAttribute('aria-busy');
      }
    }
  };
  pagination.addEventListener('click', changePage);
  const unbind = bindPressActions(news, { selector: 'a[href], [data-news-page]' });
  return () => {
    disposed = true;
    pager.dispose();
    imageObserver?.disconnect();
    visibilityObserver?.disconnect();
    pagination.removeEventListener('click', changePage);
    unbindScrollOrder();
    unbind();
  };
}
