import fs from "node:fs/promises";
import path from "node:path";
import frContent from "./content.fr.js";
import enContent from "./content.en.js";

const rootDir = process.cwd();
const siteUrl = "https://kov.li";
const googleAnalyticsId = "G-KZLZLSWSVS";
const contentByLocale = { fr: frContent, en: enContent };

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function spotifySrc(track) {
  return `https://open.spotify.com/embed/${track.spotify.type}/${track.spotify.id}?utm_source=generator&theme=0`;
}

function spotifyUrl(track) {
  return `https://open.spotify.com/${track.spotify.type}/${track.spotify.id}`;
}

function getPaths(localeKey) {
  return localeKey === "fr"
    ? {
        styles: "styles.css?v=20260429f",
        script: "app.js?v=20260429e",
        heroVideo: "assets/videos/hero-memory.mp4",
        heroPoster: "assets/images/night-fragment-02.jpg",
        preview: `${siteUrl}/assets/images/preview.jpg`,
        languageFr: "./",
        languageEn: "en/",
        faviconBase: "assets/images",
      }
    : {
        styles: "../styles.css?v=20260429f",
        script: "../app.js?v=20260429e",
        heroVideo: "../assets/videos/hero-memory.mp4",
        heroPoster: "../assets/images/night-fragment-02.jpg",
        preview: `${siteUrl}/assets/images/preview.jpg`,
        languageFr: "../",
        languageEn: "./",
        faviconBase: "../assets/images",
      };
}

function localeAssetPath(localeKey, assetPath) {
  return localeKey === "fr" ? assetPath : `../${assetPath}`;
}

function renderLyricsPanel(track, content) {
  const hasLyrics = Boolean(track.lyrics?.trim());
  const lyricsBody = hasLyrics
    ? track.lyrics
        .trim()
        .split("\n")
        .map((line) => `<p>${line ? escapeHtml(line) : "&nbsp;"}</p>`)
        .join("")
    : `<p class="lyrics-empty">${escapeHtml(content.trackUi.lyricsEmpty)}</p>`;

  return `
    <details class="lyrics-panel">
      <summary>${escapeHtml(content.trackUi.lyricsSummary)}</summary>
      <div class="lyrics-scroll">${lyricsBody}</div>
    </details>
  `;
}

function renderTrackCard(track, index, arcName, localeKey, content) {
  const staticVisualLabel = localeKey === "fr" ? "Visuel fixe" : "Still image";
  const features = track.features?.length
    ? `<p class="track-features">${escapeHtml(content.trackUi.with)} ${escapeHtml(track.features.join(", "))}</p>`
    : "";
  const visual = track.visual
    ? `
      <button
        class="track-visual-trigger"
        type="button"
        data-video="${localeAssetPath(localeKey, track.visual)}"
        data-poster="${localeAssetPath(localeKey, track.cover || "")}"
        aria-label="${escapeHtml(`${content.trackUi.loadVisualAria} ${track.title}`)}">
        <img class="track-visual-poster" src="${localeAssetPath(localeKey, track.cover)}" loading="lazy" alt="${escapeHtml(`${track.title} ${content.trackUi.coverAltSuffix}`)}" />
        <span class="track-visual-badge">${escapeHtml(content.trackUi.loadVisual)}</span>
      </button>
    `
    : "";
  const imageVisual = track.image
    ? `
      <div class="track-visual-wrap">
        <img class="track-visual-poster track-visual-image" src="${localeAssetPath(localeKey, track.image)}" loading="lazy" alt="${escapeHtml(`${track.title} still`)}" />
        <span class="track-visual-badge track-visual-badge-static">${escapeHtml(staticVisualLabel)}</span>
      </div>
    `
    : "";

  return `
    <article class="track-card reveal" style="--delay:${Math.min(index, 8) * 45}ms">
      <div class="track-head">
        <p class="track-number">${String(index + 1).padStart(2, "0")} / ${arcName}</p>
        <h3>${escapeHtml(track.title)}</h3>
        ${features}
        <p class="track-description">${escapeHtml(track.description)}</p>
      </div>

      <div class="track-media-row">
        <div class="track-spotify">
          <div class="spotify-player">
            <div class="spotify-player-top">
              <span>${escapeHtml(content.trackUi.listen)}</span>
            </div>
            <iframe
              class="spotify-frame deferred-embed"
              title="Spotify embed: ${escapeHtml(track.title)}"
              data-src="${spotifySrc(track)}"
              width="100%"
              height="152"
              frameborder="0"
              allowfullscreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"></iframe>
            <a class="spotify-fallback" href="${spotifyUrl(track)}" target="_blank" rel="noreferrer">${escapeHtml(content.trackUi.spotifyFallback)}</a>
          </div>

        </div>

        ${visual ? `<div class="track-visual-wrap">${visual}</div>` : imageVisual}
      </div>


      ${renderLyricsPanel(track, content)}

    </article>
  `;
}

function renderDiaryItem(item, index, localeKey, content) {
  return `
    <figure class="diary-item reveal${index >= 6 ? " is-extra" : ""}" style="--delay:${index * 55}ms">
      <button
        class="gallery-lightbox-trigger diary-photo-button"
        type="button"
        data-image="${localeAssetPath(localeKey, item.image)}"
        data-caption="${escapeHtml(item.caption)}"
        aria-label="${escapeHtml(`${content.diaryUi.openImage} ${item.caption}`)}">
        <img src="${localeAssetPath(localeKey, item.image)}" loading="lazy" alt="${escapeHtml(content.diaryUi.alt)}" />
      </button>
      <figcaption>${escapeHtml(item.caption)}</figcaption>
    </figure>
  `;
}

function renderClaraPhoto(item, index, localeKey, content) {
  return `
    <figure class="clara-photo clara-photo-${index + 1}">
      <button
        class="gallery-lightbox-trigger clara-photo-button"
        type="button"
        data-image="${localeAssetPath(localeKey, item.image)}"
        data-caption="${escapeHtml(item.caption)}"
        aria-label="${escapeHtml(`${content.clara.openImage} ${item.caption}`)}">
        <img src="${localeAssetPath(localeKey, item.image)}" loading="lazy" alt="${escapeHtml(`${content.clara.galleryAltPrefix} ${item.caption}`)}" />
      </button>
      <figcaption>${escapeHtml(item.caption)}</figcaption>
    </figure>
  `;
}

function renderSupportLinks(content) {
  const links = [
    [content.support.linksUi.appleMusic, content.links.appleMusic],
    [content.support.linksUi.deezer, content.links.deezer],
    [content.support.linksUi.tidal, content.links.tidal],
    [content.support.linksUi.youtube, content.links.youtube],

  ].filter(([, href]) => Boolean(href));

  return links
    .map(([label, href]) => `<a href="${href}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
    .join("");
}

function renderClaraTracks(content) {
  const tracks = content.arcA.filter((track) => track.features?.includes("CLARA LØFT"));
  if (!tracks.length) {
    return `<p class="feature-empty">${escapeHtml(content.clara.featureEmpty)}</p>`;
  }

  return tracks
    .map(
      (track) => `
        <a class="feature-pill" href="https://open.spotify.com/album/${track.spotify.id}" target="_blank" rel="noreferrer">
          ${escapeHtml(track.title)}
        </a>
      `
    )
    .join("");
}

function nlToHtml(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function buildPage(localeKey) {
  const content = contentByLocale[localeKey];
  const paths = getPaths(localeKey);
  const pageUrl = localeKey === "fr" ? `${siteUrl}/` : `${siteUrl}/en/`;

  return `<!doctype html>
<html lang="${content.meta.lang}" dir="ltr">
  <head>
    <link rel="icon" type="image/png" sizes="32x32" href="${paths.faviconBase}/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="${paths.faviconBase}/favicon-16x16.png">
    <link rel="apple-touch-icon" href="${paths.faviconBase}/apple-touch-icon.png">
    <link rel="icon" href="${paths.faviconBase}/favicon.ico">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(content.meta.description)}" />
    <meta name="theme-color" content="#050505" />
    <link rel="canonical" href="${pageUrl}" />
    <link rel="alternate" hreflang="fr" href="${siteUrl}/" />
    <link rel="alternate" hreflang="en" href="${siteUrl}/en/" />
    <link rel="alternate" hreflang="x-default" href="${siteUrl}/" />
    <meta property="og:title" content="${escapeHtml(content.meta.title)}" />
    <meta property="og:description" content="${escapeHtml(content.meta.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:image" content="${paths.preview}">
    <meta property="og:locale" content="${content.meta.ogLocale}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${paths.preview}">
    <title>${escapeHtml(content.meta.title)}</title>
    <script async src="https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleAnalyticsId}');
    </script>
    <link rel="preload" href="${paths.heroPoster}" as="image" />
    <link rel="stylesheet" href="${paths.styles}" />
  </head>
  <body>
    <div class="site-noise" aria-hidden="true"></div>
    <header class="topbar" aria-label="Primary">
      <a class="wordmark" href="#top" aria-label="KØVLI home">KØVLI</a>
      <button
        class="nav-toggle"
        type="button"
        aria-expanded="false"
        aria-controls="site-nav"
        aria-label="${escapeHtml(content.nav.open)}"
        data-label-open="${escapeHtml(content.nav.open)}"
        data-label-close="${escapeHtml(content.nav.close)}">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav id="site-nav" class="nav-links" aria-label="Sections">
<<<<<<< Updated upstream
        <a class="nav-link nav-link-section" href="#story">${escapeHtml(content.nav.story)}</a>
        <a class="nav-link nav-link-section" href="#shifted-lives">${escapeHtml(content.nav.arc1)}</a>
        <a class="nav-link nav-link-section" href="#je-descends-ici">${escapeHtml(content.nav.arc2)}</a>
        <a class="nav-link nav-link-section" href="#kovli">${escapeHtml(content.nav.kovli)}</a>
        <a class="nav-link nav-link-section" href="#clara">${escapeHtml(content.nav.clara)}</a>
        <a class="nav-link nav-link-section" href="#support">${escapeHtml(content.nav.listen)}</a>
        <a class="nav-link nav-link-language" href="${paths.languageFr}" hreflang="fr" lang="fr"${localeKey === "fr" ? ' aria-current="page"' : ""}>${content.langSwitch.fr}</a>
        <a class="nav-link nav-link-language" href="${paths.languageEn}" hreflang="en" lang="en"${localeKey === "en" ? ' aria-current="page"' : ""}>${content.langSwitch.en}</a>
=======
        <a href="#story">${escapeHtml(content.nav.story)}</a>
        <a href="#shifted-lives">${escapeHtml(content.nav.arc1)}</a>
        <a href="#je-descends-ici">${escapeHtml(content.nav.arc2)}</a>
        <a href="#kovli">${escapeHtml(content.nav.kovli)}</a>
        <a href="#clara">${escapeHtml(content.nav.clara)}</a>
        <a href="#support">${escapeHtml(content.nav.listen)}</a>
        <a href="${paths.languageFr}" hreflang="fr" lang="fr"${localeKey === "fr" ? ' aria-current="page"' : ""}>${content.langSwitch.fr}</a>
        <a href="${paths.languageEn}" hreflang="en" lang="en"${localeKey === "en" ? ' aria-current="page"' : ""}>${content.langSwitch.en}</a>
>>>>>>> Stashed changes
      </nav>
    </header>

    <main id="top">
      <section class="hero section-snap" aria-label="KØVLI hero">
        <video
          class="hero-video"
          data-src="${paths.heroVideo}"
          poster="${paths.heroPoster}"
          muted
          loop
          playsinline
          preload="none"
        ></video>
        <div class="hero-still" aria-hidden="true"></div>
        <div class="hero-shade" aria-hidden="true"></div>
        <div class="hero-content reveal">
          <p class="eyebrow">${escapeHtml(content.hero.eyebrow)}</p>
          <h1>KØVLI</h1>
          <p class="hero-subtitle">
            ${escapeHtml(content.hero.subtitle[0])}<br />
            ${escapeHtml(content.hero.subtitle[1])}<br />
            ${escapeHtml(content.hero.subtitle[2])}
          </p>
          <div class="hero-actions" aria-label="Hero actions">
            <a class="button button-primary" href="#support">${escapeHtml(content.hero.listen)}</a>
            <a class="button" href="#shifted-lives">${escapeHtml(content.hero.explore)}</a>
            <a class="button" href="${content.links.instagram}" target="_blank" rel="noreferrer">${escapeHtml(content.hero.instagram)}</a>
          </div>
        </div>
        <a class="scroll-cue" href="#story" aria-label="${escapeHtml(content.hero.scroll)}">
          <span></span>
        </a>
      </section>

      <section id="story" class="story-section content-section">
        <div class="section-kicker reveal">${escapeHtml(content.story.kicker)}</div>
        <div class="story-grid">
          <div class="story-copy reveal">
            <h2>${content.story.title}</h2>
            ${content.story.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </div>
          <div class="story-image reveal" data-parallax="soft">
            <img src="${localeAssetPath(localeKey, "assets/images/kovli-01.jpg")}" loading="lazy" alt="KØVLI submerged in blue water" />
          </div>
        </div>
      </section>

      <section id="shifted-lives" class="content-section arc-section">
        <div class="arc-intro reveal">
          <p class="section-kicker">${escapeHtml(content.arcs.arc1.kicker)}</p>
          <h2>${escapeHtml(content.arcs.arc1.title)}</h2>
          <p>${escapeHtml(content.arcs.arc1.intro)}</p>
        </div>
        <div id="arc-a-tracks" class="track-list" aria-live="polite">
          ${content.arcA.map((track, index) => renderTrackCard(track, index, "1", localeKey, content)).join("")}
        </div>
      </section>

      <section id="je-descends-ici" class="content-section arc-section arc-b">
        <div class="arc-intro reveal">
          <p class="section-kicker">${escapeHtml(content.arcs.arc2.kicker)}</p>
          <h2>${escapeHtml(content.arcs.arc2.title)}</h2>
          <p>${escapeHtml(content.arcs.arc2.intro)}</p>
          <p class="development-note">${nlToHtml(content.arcs.arc2.developmentNote)}</p>
        </div>
        <div id="arc-b-tracks" class="track-list" aria-live="polite">
          ${content.arcB.map((track, index) => renderTrackCard(track, index, "2", localeKey, content)).join("")}
        </div>
      </section>

      <section id="kovli" class="content-section diary-section">
        <div class="split-heading reveal">
          <p class="section-kicker">${escapeHtml(content.diaryUi.kicker)}</p>
          <h2>${content.diaryUi.title}</h2>
          <a class="text-link" href="${content.links.instagram}" target="_blank" rel="noreferrer">${escapeHtml(content.diaryUi.follow)}</a>
        </div>
        <div id="visual-diary" class="diary-grid">
          ${content.diary.map((item, index) => renderDiaryItem(item, index, localeKey, content)).join("")}
        </div>
        <div class="diary-more-wrap">
          <button id="diary-more" class="button diary-more" type="button" data-label-more="${escapeHtml(content.diaryUi.more)}" data-label-less="${escapeHtml(content.diaryUi.less)}"${content.diary.length <= 6 ? " hidden" : ""}>${escapeHtml(content.diaryUi.more)}</button>
        </div>
      </section>

      <section id="clara" class="content-section clara-section">
        <div class="clara-copy reveal">
          <p class="section-kicker">${escapeHtml(content.clara.kicker)}</p>
          <h2>${escapeHtml(content.clara.title)}</h2>
          ${content.clara.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          <div id="clara-tracks" class="feature-list">${renderClaraTracks(content)}</div>
        </div>
        <div id="clara-gallery" class="clara-visual clara-gallery reveal" data-parallax="soft">
          ${content.claraGallery.map((item, index) => renderClaraPhoto(item, index, localeKey, content)).join("")}
        </div>
      </section>

      <section id="in-between" class="in-between-section content-section">
        <div class="in-between-copy reveal">
          ${content.inBetween.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>
      </section>

      <section id="support" class="support-section content-section">
        <div class="support-copy reveal">
          <p class="section-kicker">${escapeHtml(content.support.kicker)}</p>
          <h2>${content.support.title}</h2>
        </div>
        <div class="support-panel reveal">
          <div class="support-stack">
            <div class="support-embed">
              <iframe
                class="deferred-embed"
                title="${escapeHtml(content.support.playlistTitle)}"
                data-src="https://open.spotify.com/embed/playlist/6gN6tANpklAu4MB29oR5Co?utm_source=generator&theme=0"
                width="100%"
                height="352"
                frameborder="0"
                allowfullscreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            </div>
            <div class="support-side">
              <a class="support-fallback" href="${content.links.playlist}" target="_blank" rel="noreferrer">${escapeHtml(content.support.fallback)}</a>
              <div id="support-links" class="support-links">${renderSupportLinks(content)}</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>KØVLI</p>
      <div class="footer-socials" aria-label="Social links">
        <a href="${content.links.instagram}" target="_blank" rel="noreferrer">IG</a>
        <a href="${content.links.tiktok}" target="_blank" rel="noreferrer">TT</a>
      </div>
      <p class="footer-note">${escapeHtml(content.footer.note)}</p>
    </footer>

    <dialog id="image-lightbox" class="image-lightbox" aria-label="${escapeHtml(content.lightbox.label)}">
      <button class="image-lightbox-close" type="button" aria-label="${escapeHtml(content.lightbox.close)}">${escapeHtml(content.lightbox.close)}</button>
      <img id="image-lightbox-asset" src="" alt="" />
      <p id="image-lightbox-caption"></p>
    </dialog>

    <script src="${paths.script}"></script>
  </body>
</html>
`;
}

await fs.mkdir(path.join(rootDir, "en"), { recursive: true });
await fs.writeFile(path.join(rootDir, "index.html"), buildPage("fr"));
await fs.writeFile(path.join(rootDir, "en", "index.html"), buildPage("en"));
await fs.writeFile(
  path.join(rootDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="${siteUrl}/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/" />\n  </url>\n  <url>\n    <loc>${siteUrl}/en/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="${siteUrl}/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/" />\n  </url>\n</urlset>\n`
);
await fs.writeFile(path.join(rootDir, "robots.txt"), `Sitemap: ${siteUrl}/sitemap.xml\n`);
