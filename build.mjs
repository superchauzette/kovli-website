import fs from "node:fs/promises";
import { readdirSync } from "node:fs";
import path from "node:path";
import frContent from "./content.fr.js";
import enContent from "./content.en.js";

const rootDir = process.cwd();

// Pochettes de singles (celles affichées sur Spotify) : assets/images/covers/<slug>.jpg
const coverFiles = new Set(readdirSync(path.join(rootDir, "assets/images/covers")));
function coverForTitle(title) {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return coverFiles.has(`${slug}.jpg`) ? `assets/images/covers/${slug}.jpg` : null;
}
const siteUrl = "https://kov.li";
const googleAnalyticsId = "G-KZLZLSWSVS";
const contentByLocale = { fr: frContent, en: enContent };

// ============================================================
//  PLACEHOLDERS À REMPLIR — regroupés ici volontairement.
//  Voir aussi <!-- EMAIL_FORM_EMBED --> dans la section capture.
// ============================================================
// 1) Meta Pixel : remplace PIXEL_ID_ICI par l'ID numérique du pixel.
const META_PIXEL_ID = "231554627793556";
// 2) CTA prioritaire : profil Spotify (PAS un album). Pré-rempli avec
//    le profil KØVLI connu — remplace si tu veux forcer une autre URL.
const SPOTIFY_PROFILE_URL = "https://open.spotify.com/intl-fr/artist/4T91cWzQpg31KoUXLNu3WB?si=jbLb-9FMSCOd-NLM3lJtng";
// 3) Pre-save prochaine sortie : lien du pré-enregistrement (Distrokid,
//    Feature.fm, Show.co, Laylo…). À remplir quand la sortie est calée.
const PRESAVE_URL = "https://distrokid.com/hyperfollow/kvli41/one-more-star";
// 4) Contact presse : email affiché dans le bloc Presse (bookings/médias).
const PRESS_EMAIL = "hello@kov.li";
// ============================================================

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
        styles: "styles.css?v=20260824a",
        script: "app.js?v=20260824a",
        heroVideo: "assets/videos/hero-memory.mp4",
        heroPoster: "assets/images/night-fragment-02.jpg",
        preview: `${siteUrl}/assets/images/preview.jpg`,
        languageFr: "./",
        languageEn: "en/",
        faviconBase: "assets/images",
      }
    : {
        styles: "../styles.css?v=20260824a",
        script: "../app.js?v=20260824a",
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
        data-poster-from-video="${track.posterFromVideo ? "true" : "false"}"
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

  const hasVisual = Boolean(visual || imageVisual);
  const bodyId = `track-body-${arcName}-${index}`;
  const number = String(index + 1).padStart(2, "0");
  const thumbSrc = coverForTitle(track.title) || track.cover;
  const thumb = thumbSrc
    ? `<span class="track-thumb"><img src="${localeAssetPath(localeKey, thumbSrc)}" loading="lazy" alt="" /></span>`
    : `<span class="track-thumb track-thumb-empty" aria-hidden="true">${number}</span>`;
  const featTag = track.features?.length
    ? `<span class="track-feat">${escapeHtml(content.trackUi.with)} ${escapeHtml(track.features.join(", "))}</span>`
    : "";

  return `
    <article class="track-card reveal" style="--delay:${Math.min(index, 8) * 45}ms">
      <button class="track-toggle" type="button" aria-expanded="false" aria-controls="${bodyId}">
        ${thumb}
        <span class="track-toggle-text">
          <span class="track-number">${number}</span>
          <span class="track-name">${escapeHtml(track.title)}${featTag}</span>
          <span class="track-teaser">${escapeHtml(track.description)}</span>
        </span>
        <span class="track-chevron" aria-hidden="true"></span>
      </button>

      <div class="track-body" id="${bodyId}" hidden>
        ${features}
        <p class="track-description">${escapeHtml(track.description)}</p>

        <div class="track-media-row${hasVisual ? " has-visual" : ""}">
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
      </div>
    </article>
  `;
}

// Média d'un item de galerie : vidéo (muette, boucle) si item.video, sinon image.
// L'image sert de poster à la vidéo. Le clic ouvre la lightbox (avec son pour la vidéo).
function galleryMedia(item, localeKey, alt) {
  if (item.video) {
    const poster = item.image ? ` poster="${localeAssetPath(localeKey, item.image)}"` : "";
    return `
      <video class="gallery-video" src="${localeAssetPath(localeKey, item.video)}"${poster}
        muted loop autoplay playsinline preload="metadata"></video>
      <span class="gallery-video-badge" aria-hidden="true"></span>`;
  }
  return `<img src="${localeAssetPath(localeKey, item.image)}" loading="lazy" alt="${escapeHtml(alt)}" />`;
}

function renderDiaryItem(item, index, localeKey, content) {
  const videoAttr = item.video ? ` data-video="${localeAssetPath(localeKey, item.video)}"` : "";
  return `
    <figure class="diary-item reveal${index >= 6 ? " is-extra" : ""}" style="--delay:${index * 55}ms">
      <button
        class="gallery-lightbox-trigger diary-photo-button"
        type="button"${videoAttr}
        data-image="${localeAssetPath(localeKey, item.image || "")}"
        data-caption="${escapeHtml(item.caption)}"
        aria-label="${escapeHtml(`${content.diaryUi.openImage} ${item.caption}`)}">
        ${galleryMedia(item, localeKey, content.diaryUi.alt)}
      </button>
      <figcaption>${escapeHtml(item.caption)}</figcaption>
    </figure>
  `;
}

function renderClaraPhoto(item, index, localeKey, content) {
  const videoAttr = item.video ? ` data-video="${localeAssetPath(localeKey, item.video)}"` : "";
  return `
    <figure class="clara-photo clara-photo-${index + 1}">
      <button
        class="gallery-lightbox-trigger clara-photo-button"
        type="button"${videoAttr}
        data-image="${localeAssetPath(localeKey, item.image || "")}"
        data-caption="${escapeHtml(item.caption)}"
        aria-label="${escapeHtml(`${content.clara.openImage} ${item.caption}`)}">
        ${galleryMedia(item, localeKey, `${content.clara.galleryAltPrefix} ${item.caption}`)}
      </button>
      <figcaption>${escapeHtml(item.caption)}</figcaption>
    </figure>
  `;
}

function renderSupportLinks(content) {
  const links = [
    [content.support.linksUi.appleMusic, content.links.appleMusic],
    [content.support.linksUi.amazonMusic, content.links.amazonMusic],
    [content.support.linksUi.deezer, content.links.deezer],
    [content.support.linksUi.tidal, content.links.tidal],
    [content.support.linksUi.youtube, content.links.youtube],
    [content.support.linksUi.youtubeChannel, content.links.youtubeChannel],

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

// Bloc capture email — POST same-origin vers la Pages Function /api/subscribe,
// qui ajoute le contact à l'audience Resend « KOVLI - Newsletter ».
// Same-origin : app.js lit la réponse et distingue succès et échec.
const SUBSCRIBE_ENDPOINT = "/api/subscribe";

function renderCapture(content) {
  const c = content.capture;
  return `
    <div class="capture-card reveal">
      <p class="section-kicker">${escapeHtml(c.kicker)}</p>
      <h2 class="capture-title">${escapeHtml(c.title)}</h2>
      <p class="capture-subtitle">${escapeHtml(c.subtitle)}</p>

      <!-- EMAIL_FORM_EMBED : Cloudflare Pages Function -> audience Resend "KOVLI - Newsletter" -->
      <form class="capture-form" id="capture-form" method="POST" action="${SUBSCRIBE_ENDPOINT}">
        <input class="capture-input" type="email" name="EMAIL" inputmode="email" autocomplete="email"
          placeholder="${escapeHtml(c.placeholder)}" aria-label="${escapeHtml(c.placeholder)}" required />
        <button class="button button-primary capture-button" type="submit">${escapeHtml(c.button)}</button>
        <input class="capture-hp" type="text" name="email_address_check" value="" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <input type="hidden" name="locale" value="${content.meta.lang}" />
      </form>
      <p class="capture-success" data-capture-success hidden>${escapeHtml(c.success)}</p>
      <p class="capture-error" data-capture-error hidden>${escapeHtml(c.error)}</p>
      <p class="capture-note">${escapeHtml(c.note)}</p>
    </div>
  `;
}

// Bloc pre-save permanent "Prochaine sortie" — réutilisable. Le lien
// pointe vers PRESAVE_URL (constante en tête de fichier).
function renderPresave(content) {
  const c = content.presave;
  return `
    <div class="presave-card reveal">
      <p class="section-kicker">${escapeHtml(c.kicker)}</p>
      <h2 class="presave-title">${escapeHtml(c.title)}</h2>
      <p class="presave-text">${escapeHtml(c.text)}</p>
      <a class="button button-primary button-spotify presave-button" href="${PRESAVE_URL}" target="_blank" rel="noreferrer">
        <span class="button-spotify-mark" aria-hidden="true"></span>${escapeHtml(c.button)}
      </a>
    </div>
  `;
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
    <!-- ===== META PIXEL (Facebook/Instagram) — ID = constante META_PIXEL_ID dans build.mjs ===== -->
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${META_PIXEL_ID}');
      fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" /></noscript>
    <!-- ===== FIN META PIXEL ===== -->
    <link rel="preload" href="${paths.heroPoster}" as="image" />
    <link rel="stylesheet" href="${paths.styles}" />
  </head>
  <body>
    <div class="nighty-night" aria-hidden="true"></div>
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
        <a class="nav-link nav-link-section" href="#story">${escapeHtml(content.nav.story)}</a>
        <a class="nav-link nav-link-section" href="#shifted-lives">${escapeHtml(content.nav.arc1)}</a>
        <a class="nav-link nav-link-section" href="#je-descends-ici">${escapeHtml(content.nav.arc2)}</a>
        <a class="nav-link nav-link-section" href="#kovli">${escapeHtml(content.nav.kovli)}</a>
        <a class="nav-link nav-link-section" href="#clara">${escapeHtml(content.nav.clara)}</a>
        <a class="nav-link nav-link-section" href="#support">${escapeHtml(content.nav.listen)}</a>
        <a class="nav-link nav-link-language" href="${paths.languageFr}" hreflang="fr" lang="fr"${localeKey === "fr" ? ' aria-current="page"' : ""}>${content.langSwitch.fr}</a>
        <a class="nav-link nav-link-language" href="${paths.languageEn}" hreflang="en" lang="en"${localeKey === "en" ? ' aria-current="page"' : ""}>${content.langSwitch.en}</a>
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
        <div class="hero-aurora" aria-hidden="true"></div>
        <div class="hero-content reveal">
          <p class="eyebrow">${escapeHtml(content.hero.eyebrow)}</p>
          <h1>KØVLI</h1>
          <p class="hero-subtitle">
            ${content.hero.subtitle.map((line) => escapeHtml(line)).join("<br />\n            ")}
          </p>
          <div class="hero-actions" aria-label="Hero actions">
            <a class="button button-primary button-spotify" href="${SPOTIFY_PROFILE_URL}" target="_blank" rel="noreferrer">
              <span class="button-spotify-mark" aria-hidden="true"></span>${escapeHtml(content.hero.spotifyFollow)}
            </a>
            <a class="button" href="#shifted-lives">${escapeHtml(content.hero.explore)}</a>
          </div>
        </div>
        <a class="scroll-cue" href="#story" aria-label="${escapeHtml(content.hero.scroll)}">
          <span></span>
        </a>
      </section>

      <section id="capture" class="capture-section content-section">
        <div class="capture-stack">
          ${renderCapture(content)}
          ${PRESAVE_URL && PRESAVE_URL !== "PRESAVE_URL" ? renderPresave(content) : ""}
        </div>
      </section>

      <section id="story" class="story-section content-section">
        <div class="section-kicker reveal">${escapeHtml(content.story.kicker)}</div>
        <div class="story-grid">
          <div class="story-copy reveal">
            <h2>${content.story.title}</h2>
            ${content.story.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </div>
          <div class="story-image reveal" data-parallax="soft">
            ${content.story.visual?.src
              ? `<video class="story-video" src="${localeAssetPath(localeKey, content.story.visual.src)}" autoplay muted loop playsinline preload="metadata" aria-label="${escapeHtml(content.story.visual.label || "KØVLI story video")}"></video>`
              : `<img src="${localeAssetPath(localeKey, "assets/images/kovli-01.jpg")}" loading="lazy" alt="KØVLI submerged in blue water" />`}
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
          ${content.diaryUi.subtitle ? `<p class="section-lead">${escapeHtml(content.diaryUi.subtitle)}</p>` : ""}
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
          <p class="clara-page-link"><a class="text-link" href="${localeKey === "en" ? "/en/claraloft/" : "/claraloft/"}">${escapeHtml(content.clara.pageLink)}</a></p>
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
          ${content.support.subtitle ? `<p class="section-lead">${escapeHtml(content.support.subtitle)}</p>` : ""}
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
              <a class="button button-primary button-spotify support-spotify-follow" href="${SPOTIFY_PROFILE_URL}" target="_blank" rel="noreferrer">
                <span class="button-spotify-mark" aria-hidden="true"></span>${escapeHtml(content.hero.spotifyFollow)}
              </a>
              <p class="support-links-label">${escapeHtml(content.support.platformsLabel)}</p>
              <div id="support-links" class="support-links">${renderSupportLinks(content)}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="presse" class="press-section content-section">
        <div class="press-card reveal">
          <div class="press-copy">
            <p class="section-kicker">${escapeHtml(content.press.kicker)}</p>
            <h2 class="press-title">${escapeHtml(content.press.title)}</h2>
            <p class="press-text">${escapeHtml(content.press.text)}</p>
          </div>
          <a class="button button-primary press-button" href="mailto:${PRESS_EMAIL}">${escapeHtml(content.press.button)}</a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>KØVLI</p>
      <div class="footer-socials" aria-label="Social links">
        <a href="${content.links.instagram}" target="_blank" rel="noreferrer">IG</a>
        <a href="${content.links.tiktok}" target="_blank" rel="noreferrer">TT</a>
        <a href="${content.links.facebook}" target="_blank" rel="noreferrer">FB</a>
      </div>
    </footer>

    <dialog id="image-lightbox" class="image-lightbox" aria-label="${escapeHtml(content.lightbox.label)}">
      <button class="image-lightbox-close" type="button" aria-label="${escapeHtml(content.lightbox.close)}">${escapeHtml(content.lightbox.close)}</button>
      <img id="image-lightbox-asset" src="" alt="" />
      <video id="image-lightbox-video" controls playsinline hidden></video>
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
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="${siteUrl}/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/" />\n  </url>\n  <url>\n    <loc>${siteUrl}/en/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="${siteUrl}/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/" />\n  </url>\n  <url>\n    <loc>${siteUrl}/claraloft/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="${siteUrl}/claraloft/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/claraloft/" />\n  </url>\n  <url>\n    <loc>${siteUrl}/en/claraloft/</loc>\n    <xhtml:link rel="alternate" hreflang="fr" href="${siteUrl}/claraloft/" />\n    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/claraloft/" />\n  </url>\n</urlset>\n`
);
await fs.writeFile(path.join(rootDir, "robots.txt"), `Sitemap: ${siteUrl}/sitemap.xml\n`);
