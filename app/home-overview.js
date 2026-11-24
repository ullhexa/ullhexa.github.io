import { overviewSlides } from './home-overview-data.js?v=20261121-carousel';

const escape = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const categories = [
  ['plugins', 'Plugins', '#plugins', 'Audio plugins for various music production effects and workflows'],
  ['visualizers', 'Visualizers', '#visualizers', 'Browser visuals that react to MIDI notes or incoming audio.']
];

export const activeOverviewSlides = Object.fromEntries(categories.map(([key]) => [key, overviewSlides[key]]));

export const OVERVIEW_INTERVAL = 30000;
export const OVERVIEW_TRANSITION = 3000;

// Unix time gives every visitor the same schedule, independent of navigation.
// No server, cookies, stored visitor state or hidden-page timer is required.
export function createOverviewState(time = Date.now(), interval = OVERVIEW_INTERVAL) {
  const step = Math.floor(time / interval);
  const elapsed = time - step * interval;
  return { step, elapsed, remaining: interval - elapsed };
}

export function renderHomeOverview(state = createOverviewState()) {
  return categories.map(([key, title, href, description]) => {
    const first = overviewSlides[key][state.step % overviewSlides[key].length];
    return `<article class="homeOverviewCard" data-overview-carousel="${key}" data-overview-step="${state.step}" aria-label="${title} previews">
      <a class="homeOverviewImage homeOverviewImageLink" href="${href}" aria-label="Explore ${title}">
        <img class="homeOverviewSlide" src="${first.src}" alt="${escape(first.alt)}" width="${first.width}" height="${first.height}" decoding="async" />
      </a>
      <a class="homeOverviewItem" href="${href}">
        <div class="homeOverviewCopy"><h2>${title} <span aria-hidden="true">→</span></h2><p>${escape(description)}</p></div>
      </a>
    </article>`;
  }).join('');
}

// One absolute schedule and one ready batch keep the categories in step.
// Load only the current lineup. Slow loads and hidden tabs never shift the clock.
export function createOverviewSequence(galleries, {
  load, show, interval = OVERVIEW_INTERVAL, transition = OVERVIEW_TRANSITION,
  now = () => Date.now(), initialStep = createOverviewState(now(), interval).step,
  schedule = (callback, delay) => setTimeout(callback, delay),
  cancel = timer => clearTimeout(timer)
}) {
  let running = false, disposed = false, pending = false, timer = null;
  let displayedStep = initialStep;
  const position = () => createOverviewState(now(), interval);
  const stopTimer = () => {
    if (timer !== null) cancel(timer);
    timer = null;
  };
  const queue = () => {
    if (!disposed && running && !pending && timer === null) {
      timer = schedule(() => {
        timer = null;
        synchronize(true);
      }, position().remaining);
    }
  };
  async function synchronize(allowAnimation = false) {
    if (!running || disposed || pending) return;
    const { step } = position();
    if (step === displayedStep) { queue(); return; }
    pending = true;
    let failed = false;
    try {
      const batch = await Promise.all(Object.entries(galleries).map(async ([key, slides]) => {
        const slide = slides[step % slides.length];
        return { key, slide, image: await load(slide) };
      }));
      if (disposed || !running) return;
      const current = position();
      // A suspended browser or slow request may have crossed another boundary.
      // Discard that stale batch and join the current lineup, without replaying it.
      if (current.step !== step) return;
      const animate = allowAnimation && step === displayedStep + 1 && current.elapsed < transition;
      const finished = show(batch, { animate, elapsed: current.elapsed, duration: transition });
      displayedStep = step;
      await finished;
    } catch {
      // Preserve the existing frames if any preview fails; retry at the next slot.
      failed = true;
    } finally {
      pending = false;
      if (!disposed && running) {
        if (!failed && position().step !== displayedStep) synchronize();
        else queue();
      }
    }
  }
  return {
    setRunning(value) {
      if (disposed || running === Boolean(value)) return;
      running = Boolean(value);
      if (running) synchronize();
      else stopTimer();
    },
    dispose() { disposed = true; running = false; stopTimer(); }
  };
}

function decodeSlide(slide) {
  return new Promise((resolve, reject) => {
    const image = new Image(slide.width, slide.height);
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.alt = slide.alt;
    const timeout = setTimeout(() => finish(new Error('Image timeout')), 12000);
    let settled = false;
    function finish(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = image.onerror = null;
      error ? reject(error) : resolve(image);
    }
    image.onerror = () => finish(new Error('Image unavailable'));
    image.onload = () => {
      if (image.decode) image.decode().then(() => finish(), finish);
      else finish();
    };
    image.src = slide.src;
  });
}

export function mountHomeOverview(root) {
  const overview = root.querySelector('.homeOverview');
  if (!overview) return () => {};
  const stages = new Map([...overview.querySelectorAll('[data-overview-carousel]')].map(card =>
    [card.dataset.overviewCarousel, card.querySelector('.homeOverviewImage')]
  ));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection?.saveData);
  const removers = [];
  let ready = document.readyState === 'complete', visible = false;
  let animations = [];
  const listen = (target, event, callback) => {
    target.addEventListener(event, callback);
    removers.push(() => target.removeEventListener(event, callback));
  };
  const sequence = createOverviewSequence(activeOverviewSlides, {
    initialStep: Number(overview.querySelector('[data-overview-step]').dataset.overviewStep),
    load: decodeSlide,
    show(batch, { animate, elapsed, duration }) {
      const previousImages = [];
      const timing = { duration, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' };
      animations = [];
      // Reduced motion still follows the shared lineup without moving images.
      const slide = animate && !reduced.matches && typeof Element.prototype.animate === 'function';
      const start = document.timeline.currentTime;
      for (const { key, image } of batch) {
        const stage = stages.get(key);
        image.className = 'homeOverviewSlide';
        if (!slide) { stage.replaceChildren(image); continue; }
        const previous = stage.lastElementChild;
        previous.setAttribute('aria-hidden', 'true');
        stage.replaceChildren(previous, image);
        previousImages.push(previous);
        const outgoing = previous.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], timing);
        const incoming = image.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], timing);
        // Account for decode time so the transition ends on the shared schedule.
        if (start !== null) { outgoing.startTime = start - elapsed; incoming.startTime = start - elapsed; }
        else { outgoing.currentTime = elapsed; incoming.currentTime = elapsed; }
        animations.push(outgoing, incoming);
      }
      const active = animations;
      return Promise.allSettled(active.map(animation => animation.finished)).then(() => {
        previousImages.forEach(image => image.remove());
        active.forEach(animation => animation.cancel());
        if (animations === active) animations = [];
      });
    }
  });
  const update = () => {
    sequence.setRunning(ready && visible && !document.hidden && !saveData);
    if (document.hidden || reduced.matches) animations.forEach(animation => animation.finish());
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }) : null;
  if (observer) { observer.observe(overview); removers.push(() => observer.disconnect()); }
  else visible = true;
  // Visibility only suspends local work. Returning joins the absolute schedule.
  // Hover/focus do not change it; category link targets remain stable.
  listen(document, 'visibilitychange', update);
  listen(reduced, 'change', update);
  listen(window, 'load', () => { ready = true; update(); });
  update();
  return () => { sequence.dispose(); removers.forEach(remove => remove()); animations.forEach(animation => animation.cancel()); };
}
