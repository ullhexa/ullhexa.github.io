import { musicReleases } from './music-data.js?v=20261116-public-credit';

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
});

export function syncEnquiryURL(title = '') {
  return `#contact?subject=${encodeURIComponent(
    title ? `Sync enquiry: Ull Hexa - ${title}` : 'Sync enquiry: Ull Hexa'
  )}`;
}

export function renderMusicCatalogue(releases = musicReleases) {
  const ordered = [...releases].sort((a, b) => b.date.localeCompare(a.date));
  return `<section class="musicCatalogue" aria-label="Music by Ull Hexa">
    <div class="musicIntro">
      <h2 class="visuallyHidden">Music by Ull Hexa</h2>
      <p>Released music by Ull Hexa. For sync licensing, get in touch through the contact form.</p>
      <p><strong>Master and composition/publishing rights controlled by Ull Hexa.</strong><br>
        Contact me to discuss licensing and availability for your project.</p>
      <p>Composed, produced, mixed and mastered by Ull Hexa. Distributed through Symphonic.</p>
      <p class="musicContact"><a href="${syncEnquiryURL()}">Contact for sync <span aria-hidden="true">→</span></a></p>
    </div>
    <div class="musicReleaseList">
      ${ordered.map(release => `<article class="musicRelease" aria-labelledby="music-${escapeHTML(release.id)}">
        <img class="musicCover" src="${escapeHTML(release.image)}" alt="${escapeHTML(release.imageAlt)}" width="600" height="600" loading="lazy" decoding="async" />
        <div class="musicReleaseCopy">
          <h3 id="music-${escapeHTML(release.id)}">${escapeHTML(release.title)}</h3>
          <p class="musicArtist">Ull Hexa · Single</p>
          <dl class="musicMetadata">
            <div><dt>Released</dt><dd><time datetime="${escapeHTML(release.date)}">${dateFormatter.format(new Date(`${release.date}T00:00:00Z`))}</time></dd></div>
            <div><dt>Duration</dt><dd>${escapeHTML(release.duration)}</dd></div>
            <div><dt>Composer</dt><dd>${escapeHTML(release.composer)}</dd></div>
            <div><dt>Sound</dt><dd>${escapeHTML(release.sound)}</dd></div>
            <div><dt>Master</dt><dd>${escapeHTML(release.masterFormat)}</dd></div>
          </dl>
          <div class="musicLinks" aria-label="Listen to ${escapeHTML(release.title)}">
            ${release.links.map(link => `<a href="${escapeHTML(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)} <span aria-hidden="true">↗</span></a>`).join('')}
          </div>
          <a class="musicSyncLink" href="${syncEnquiryURL(release.title)}">Sync enquiry <span aria-hidden="true">→</span></a>
          <details class="musicStory">
            <summary>Behind the track <span class="musicStoryArrow" aria-hidden="true">▸</span></summary>
            <div class="musicStoryText">${release.paragraphs.map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
          </details>
        </div>
      </article>`).join('')}
    </div>
  </section>`;
}
